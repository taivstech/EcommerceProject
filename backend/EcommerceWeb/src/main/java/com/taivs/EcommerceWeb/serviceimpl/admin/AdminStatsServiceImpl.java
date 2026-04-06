package com.taivs.EcommerceWeb.serviceimpl.admin;

import com.taivs.EcommerceWeb.config.common.AsyncConfig;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.dto.response.admin.CategoryRevenueStats;
import com.taivs.EcommerceWeb.dto.response.admin.DashboardStats;
import com.taivs.EcommerceWeb.dto.response.admin.RevenueDataPoint;
import com.taivs.EcommerceWeb.dto.response.admin.TopProductStats;
import com.taivs.EcommerceWeb.dto.response.admin.UserGrowthDataPoint;
import com.taivs.EcommerceWeb.services.admin.AdminStatsService;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.repositories.product.ProductRepository;
import com.taivs.EcommerceWeb.repositories.shop.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AdminStatsServiceImpl implements AdminStatsService {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final Executor taskExecutor;

    @Autowired
    public AdminStatsServiceImpl(UserRepository userRepository,
                                  ShopRepository shopRepository,
                                  ProductRepository productRepository,
                                  OrderRepository orderRepository,
                                  @Qualifier("taskExecutor") Executor taskExecutor) {
        this.userRepository    = userRepository;
        this.shopRepository    = shopRepository;
        this.productRepository = productRepository;
        this.orderRepository   = orderRepository;
        this.taskExecutor      = taskExecutor;
    }

    @Override
    public DashboardStats getDashboardStats() {

        CompletableFuture<Long> totalUsersFuture =
                CompletableFuture.supplyAsync(userRepository::count, taskExecutor);

        CompletableFuture<Long> activeUsersFuture =
                CompletableFuture.supplyAsync(() -> userRepository.countByActive(true), taskExecutor);

        CompletableFuture<Long> totalShopsFuture =
                CompletableFuture.supplyAsync(shopRepository::count, taskExecutor);

        CompletableFuture<Long> pendingShopsFuture =
                CompletableFuture.supplyAsync(() -> shopRepository.countByStatus("PENDING"), taskExecutor);

        CompletableFuture<Long> approvedShopsFuture =
                CompletableFuture.supplyAsync(() -> shopRepository.countByStatus("APPROVED"), taskExecutor);

        CompletableFuture<Long> totalProductsFuture =
                CompletableFuture.supplyAsync(productRepository::count, taskExecutor);

        CompletableFuture<Long> activeProductsFuture =
                CompletableFuture.supplyAsync(() -> productRepository.countActiveProducts(), taskExecutor);

        CompletableFuture<Long> totalOrdersFuture =
                CompletableFuture.supplyAsync(orderRepository::count, taskExecutor);

        CompletableFuture<Long> pendingOrdersFuture =
                CompletableFuture.supplyAsync(
                        () -> orderRepository.countByStatus(
                                OrderStatus.PENDING),
                        taskExecutor);

        CompletableFuture<BigDecimal> revenueFuture =
                CompletableFuture.supplyAsync(orderRepository::calculateTotalRevenue, taskExecutor);

        totalUsersFuture       = totalUsersFuture.exceptionally(ex -> { log.error("totalUsers query failed", ex);   return 0L; });
        activeUsersFuture      = activeUsersFuture.exceptionally(ex -> { log.error("activeUsers query failed", ex);  return 0L; });
        totalShopsFuture       = totalShopsFuture.exceptionally(ex -> { log.error("totalShops query failed", ex);   return 0L; });
        pendingShopsFuture     = pendingShopsFuture.exceptionally(ex -> { log.error("pendingShops query failed", ex); return 0L; });
        approvedShopsFuture    = approvedShopsFuture.exceptionally(ex -> { log.error("approvedShops query failed", ex); return 0L; });
        totalProductsFuture    = totalProductsFuture.exceptionally(ex -> { log.error("totalProducts query failed", ex); return 0L; });
        activeProductsFuture   = activeProductsFuture.exceptionally(ex -> { log.error("activeProducts query failed", ex); return 0L; });
        totalOrdersFuture      = totalOrdersFuture.exceptionally(ex -> { log.error("totalOrders query failed", ex);  return 0L; });
        pendingOrdersFuture    = pendingOrdersFuture.exceptionally(ex -> { log.error("pendingOrders query failed", ex); return 0L; });
        revenueFuture          = revenueFuture.exceptionally(ex -> { log.error("revenue query failed", ex); return BigDecimal.ZERO; });

        CompletableFuture.allOf(
                totalUsersFuture, activeUsersFuture,
                totalShopsFuture, pendingShopsFuture, approvedShopsFuture,
                totalProductsFuture, activeProductsFuture,
                totalOrdersFuture, pendingOrdersFuture,
                revenueFuture
        ).join();

        return DashboardStats.builder()
                .totalUsers(totalUsersFuture.join())
                .activeUsers(activeUsersFuture.join())
                .totalShops(totalShopsFuture.join())
                .pendingShops(pendingShopsFuture.join())
                .approvedShops(approvedShopsFuture.join())
                .totalProducts(totalProductsFuture.join())
                .approvedProducts(activeProductsFuture.join())
                .totalOrders(totalOrdersFuture.join())
                .pendingOrders(pendingOrdersFuture.join())
                .totalRevenue(revenueFuture.join())
                .pendingProducts(0L)
                .build();
    }

    @Override
    public List<RevenueDataPoint> getRevenueChart(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return orderRepository.findDailyRevenue(since).stream()
                .map(row -> RevenueDataPoint.builder()
                        .label(row[0].toString())
                        .revenue(row[1] instanceof BigDecimal bd ? bd : new BigDecimal(row[1].toString()))
                        .orderCount(((Number) row[2]).longValue())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<RevenueDataPoint> getMonthlyRevenueChart(int months) {
        LocalDateTime since = LocalDateTime.now().minusMonths(months);
        return orderRepository.findMonthlyRevenue(since).stream()
                .map(row -> RevenueDataPoint.builder()
                        .label(row[0] + "-" + String.format("%02d", ((Number) row[1]).intValue()))
                        .revenue(row[2] instanceof BigDecimal bd ? bd : new BigDecimal(row[2].toString()))
                        .orderCount(((Number) row[3]).longValue())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<TopProductStats> getTopProducts(int days, int limit) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return orderRepository.findTopProductsByRevenue(since, PageRequest.of(0, limit)).stream()
                .map(row -> TopProductStats.builder()
                        .productId((String) row[0])
                        .productName((String) row[1])
                        .imageUrl((String) row[2])
                        .totalSold(((Number) row[3]).longValue())
                        .revenue(row[4] instanceof BigDecimal bd ? bd : new BigDecimal(row[4].toString()))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<UserGrowthDataPoint> getUserGrowth(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Object[]> dailyData = userRepository.findDailyUserRegistrations(since);
        long cumulative = userRepository.count() - dailyData.stream()
                .mapToLong(row -> ((Number) row[1]).longValue()).sum();

        List<UserGrowthDataPoint> result = new ArrayList<>();
        for (Object[] row : dailyData) {
            long newUsers = ((Number) row[1]).longValue();
            cumulative += newUsers;
            result.add(UserGrowthDataPoint.builder()
                    .label(row[0].toString())
                    .newUsers(newUsers)
                    .cumulativeTotal(cumulative)
                    .build());
        }
        return result;
    }

    @Override
    public Map<String, Long> getOrderStatusDistribution() {
        return orderRepository.countGroupedByStatus().stream()
                .collect(Collectors.toMap(
                        row -> ((OrderStatus) row[0]).name(),
                        row -> ((Number) row[1]).longValue(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
    }

    @Override
    public List<CategoryRevenueStats> getCategoryRevenue(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return orderRepository.findCategoryRevenue(since).stream()
                .map(row -> CategoryRevenueStats.builder()
                        .categoryId((String) row[0])
                        .categoryName((String) row[1])
                        .orderCount(((Number) row[2]).longValue())
                        .revenue(row[3] instanceof BigDecimal bd ? bd : new BigDecimal(row[3].toString()))
                        .build())
                .collect(Collectors.toList());
    }
}

