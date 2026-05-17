package com.taivs.EcommerceWeb.serviceimpl.order;

import com.taivs.EcommerceWeb.dto.request.admin.CommissionRateRequest;
import com.taivs.EcommerceWeb.dto.response.admin.CommissionRateResponse;
import com.taivs.EcommerceWeb.dto.response.admin.CommissionRevenueResponse;
import com.taivs.EcommerceWeb.models.order.CommissionRate;
import com.taivs.EcommerceWeb.models.order.OrderShopGroup;
import com.taivs.EcommerceWeb.models.order.PlatformCommission;
import com.taivs.EcommerceWeb.repositories.order.CommissionRateRepository;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.repositories.order.PlatformCommissionRepository;
import com.taivs.EcommerceWeb.services.order.CommissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CommissionServiceImpl implements CommissionService {

    /** Default rate if no commission rates are configured at all */
    private static final BigDecimal FALLBACK_RATE = new BigDecimal("0.05"); // 5%

    private final CommissionRateRepository commissionRateRepository;
    private final PlatformCommissionRepository platformCommissionRepository;
    private final OrderRepository orderRepository;

    @Override
    public BigDecimal resolveRate(String categoryId) {
        // 1. Try category-specific rate
        if (categoryId != null) {
            var specific = commissionRateRepository.findByCategoryIdAndIsActiveTrue(categoryId);
            if (specific.isPresent()) return specific.get().getRate();
        }
        // 2. Fall back to global default
        var defaultRate = commissionRateRepository.findDefaultRate();
        if (defaultRate.isPresent()) return defaultRate.get().getRate();
        // 3. Hard-coded fallback if nothing configured yet
        return FALLBACK_RATE;
    }

    @Override
    @Transactional
    public void settleOrderCommission(String orderId) {
        var order = orderRepository.findByIdWithShippingAndGroups(orderId).orElse(null);
        if (order == null) {
            log.warn("CommissionService: order {} not found, skipping commission settlement", orderId);
            return;
        }

        for (OrderShopGroup group : order.getOrderShopGroups()) {
            // Idempotent: skip if already settled
            if (platformCommissionRepository.existsByOrderShopGroupId(group.getId())) {
                log.debug("Commission already settled for group {}", group.getId());
                continue;
            }

            // Resolve the category from the first item's product category
            String categoryId = group.getOrderItems().stream()
                    .findFirst()
                    .map(item -> {
                        try {
                            return item.getProductVariant() != null
                                    ? item.getProductVariant().getProduct().getCategory() != null
                                    ? item.getProductVariant().getProduct().getCategory().getId() : null
                                    : null;
                        } catch (Exception e) {
                            return null;
                        }
                    })
                    .orElse(null);

            BigDecimal rate = resolveRate(categoryId);
            BigDecimal gross = group.getSubtotal() != null ? group.getSubtotal() : BigDecimal.ZERO;
            BigDecimal commissionAmount = gross.multiply(rate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal netAmount = gross.subtract(commissionAmount);

            // Update the shop group
            group.setCommissionRate(rate);
            group.setCommissionAmount(commissionAmount);
            group.setNetAmount(netAmount);

            // Persist commission record
            PlatformCommission commission = PlatformCommission.builder()
                    .orderShopGroupId(group.getId())
                    .orderId(orderId)
                    .shopId(group.getShop() != null ? group.getShop().getId() : null)
                    .grossAmount(gross)
                    .commissionRate(rate)
                    .commissionAmount(commissionAmount)
                    .netAmount(netAmount)
                    .build();
            platformCommissionRepository.save(commission);

            log.info("Commission settled: orderId={} groupId={} gross={} rate={} commission={} net={}",
                    orderId, group.getId(), gross, rate, commissionAmount, netAmount);
        }
    }

    @Override
    public List<CommissionRateResponse> listRates() {
        return commissionRateRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public CommissionRateResponse upsertRate(CommissionRateRequest request) {
        String adminId = currentUserId();

        // Deactivate existing active rate for same category before creating new one
        if (request.getCategoryId() == null) {
            commissionRateRepository.findDefaultRate().ifPresent(existing -> {
                existing.setIsActive(false);
                commissionRateRepository.save(existing);
            });
        } else {
            commissionRateRepository.findByCategoryIdAndIsActiveTrue(request.getCategoryId())
                    .ifPresent(existing -> {
                        existing.setIsActive(false);
                        commissionRateRepository.save(existing);
                    });
        }

        CommissionRate newRate = CommissionRate.builder()
                .categoryId(request.getCategoryId())
                .categoryName(request.getCategoryName())
                .rate(request.getRate())
                .description(request.getDescription())
                .isActive(true)
                .effectiveFrom(LocalDateTime.now())
                .createdBy(adminId)
                .build();

        return toResponse(commissionRateRepository.save(newRate));
    }

    @Override
    @Transactional
    public void deactivateRate(String rateId) {
        commissionRateRepository.findById(rateId).ifPresent(rate -> {
            rate.setIsActive(false);
            commissionRateRepository.save(rate);
        });
    }

    @Override
    public CommissionRevenueResponse getRevenueSummary(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        LocalDateTime now = LocalDateTime.now();

        BigDecimal totalRevenue = platformCommissionRepository.sumCommissionBetween(since, now);
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        // Daily breakdown for chart
        List<Object[]> dailyRows = platformCommissionRepository.dailyRevenueSince(since);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        List<CommissionRevenueResponse.DailyRevenue> daily = dailyRows.stream()
                .map(row -> CommissionRevenueResponse.DailyRevenue.builder()
                        .date(row[0].toString())
                        .revenue(row[1] == null ? BigDecimal.ZERO : new BigDecimal(row[1].toString()))
                        .build())
                .toList();

        // Estimate GMV: if we know the avg rate, gmv = revenue / avgRate
        // Simpler: sum gross_amount from platform_commissions in the period
        BigDecimal totalGmv = daily.stream()
                .map(CommissionRevenueResponse.DailyRevenue::getRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CommissionRevenueResponse.builder()
                .totalRevenue(totalRevenue)
                .totalGmv(totalGmv)
                .days(days)
                .dailyBreakdown(daily)
                .build();
    }

    private CommissionRateResponse toResponse(CommissionRate r) {
        String rateDisplay = r.getRate() != null
                ? r.getRate().multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP) + "%"
                : "N/A";
        return CommissionRateResponse.builder()
                .id(r.getId())
                .categoryId(r.getCategoryId())
                .categoryName(r.getCategoryId() == null ? "All Categories (Default)" : r.getCategoryName())
                .isDefault(r.getCategoryId() == null)
                .rate(r.getRate())
                .rateDisplay(rateDisplay)
                .description(r.getDescription())
                .isActive(r.getIsActive())
                .effectiveFrom(r.getEffectiveFrom())
                .createdAt(r.getCreatedAt())
                .build();
    }

    private String currentUserId() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) return auth.getName();
        } catch (Exception ignored) {}
        return "system";
    }
}
