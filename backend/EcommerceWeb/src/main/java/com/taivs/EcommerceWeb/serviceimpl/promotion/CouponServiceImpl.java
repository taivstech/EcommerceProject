package com.taivs.EcommerceWeb.serviceimpl.promotion;

import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.dto.request.promotion.CreateCouponRequest;
import com.taivs.EcommerceWeb.dto.response.promotion.CouponResponse;
import com.taivs.EcommerceWeb.models.promotion.Coupon;
import com.taivs.EcommerceWeb.enums.promotion.CouponType;
import com.taivs.EcommerceWeb.enums.promotion.DiscountType;
import com.taivs.EcommerceWeb.repositories.promotion.CouponRepository;
import com.taivs.EcommerceWeb.repositories.promotion.CouponUsageRepository;
import com.taivs.EcommerceWeb.services.promotion.CouponService;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.repositories.shop.ShopRepository;
import com.taivs.EcommerceWeb.repositories.product.ProductRepository;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {
    private final CouponRepository couponRepository;
    private final ShopRepository shopRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public CouponResponse create(CreateCouponRequest request) {
        if (couponRepository.findByCode(request.getCode()).isPresent()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        validateCouponRules(request, false);

        Shop shop = null;
        if (request.getShopId() != null && !request.getShopId().isBlank()) {
            shop = shopRepository.findById(request.getShopId())
                    .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTS));
        }

        Coupon coupon = buildCoupon(request, shop);
        return toResponse(couponRepository.save(coupon));
    }

    @Override
    @Transactional
    public CouponResponse createByShopOwner(CreateCouponRequest request) {
        if (couponRepository.findByCodeForUpdate(request.getCode()).isPresent()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        String userId = currentUserId();
        Shop shop = shopRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTS));

        request.setCouponType("SHOP");
        request.setShopId(shop.getId());

        validateCouponRules(request, true);

        Coupon coupon = buildCoupon(request, shop);
        return toResponse(couponRepository.save(coupon));
    }

    @Override
    public List<CouponResponse> getAvailablePlatformCoupons() {
        String userId = currentUserId();
        return couponRepository.findActivePlatformCoupons(LocalDateTime.now())
                .stream()
                .map(c -> toResponseForUser(c, userId))
                .collect(Collectors.toList());
    }

    @Override
    public List<CouponResponse> getAvailableShopCoupons(String shopId) {
        String userId = currentUserId();
        return couponRepository.findActiveShopCoupons(shopId, LocalDateTime.now())
                .stream()
                .map(c -> toResponseForUser(c, userId))
                .collect(Collectors.toList());
    }

    @Override
    public List<CouponResponse> getMyShopCoupons() {
        String userId = currentUserId();
        Shop shop = shopRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTS));
        return couponRepository.findByShopId(shop.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<CouponResponse> getAllCoupons() {
        return couponRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CouponResponse getByCouponCode(String code) {
        Coupon coupon = couponRepository.findByCodeForUpdate(code)
                .orElseThrow(() -> new AppException(ErrorCode.COUPON_NOT_EXISTS));
        return toResponse(coupon);
    }

    @Override
    @Transactional
    public Coupon validateAndLock(String couponCode, String userId, CouponType expectedType) {

        Coupon coupon = couponRepository
                .findByCodeForUpdate(couponCode)
                .orElseThrow(() -> new AppException(ErrorCode.COUPON_NOT_EXISTS));

        if (expectedType != null && coupon.getCouponType() != expectedType) {
            throw new AppException(ErrorCode.COUPON_TYPE_MISMATCH);
        }

        if (!Boolean.TRUE.equals(coupon.getIsActive())) {
            throw new AppException(ErrorCode.COUPON_INACTIVE);
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(coupon.getValidFrom())) {
            throw new AppException(ErrorCode.COUPON_INACTIVE);
        }
        if (now.isAfter(coupon.getValidTo())) {
            throw new AppException(ErrorCode.COUPON_EXPIRED);
        }

        if (coupon.getMaxUsage() != null && coupon.getCurrentUsage() >= coupon.getMaxUsage()) {
            throw new AppException(ErrorCode.COUPON_USAGE_EXCEEDED);
        }

        long userUsedCount = couponUsageRepository.countByCoupon_IdAndUser_Id(coupon.getId(), userId);
        if (coupon.getMaxUsagePerUser() != null && userUsedCount >= coupon.getMaxUsagePerUser()) {
            throw new AppException(ErrorCode.COUPON_USAGE_EXCEEDED);
        }

        return coupon;
    }

    @Override
    public Coupon validateCoupon(String couponCode, String userId, CouponType expectedType) {
        Coupon coupon = couponRepository
                .findByCode(couponCode)
                .orElseThrow(() -> new AppException(ErrorCode.COUPON_NOT_EXISTS));

        if (expectedType != null && coupon.getCouponType() != expectedType) {
            throw new AppException(ErrorCode.COUPON_TYPE_MISMATCH);
        }

        if (!Boolean.TRUE.equals(coupon.getIsActive())) {
            throw new AppException(ErrorCode.COUPON_INACTIVE);
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(coupon.getValidFrom())) {
            throw new AppException(ErrorCode.COUPON_INACTIVE);
        }
        if (now.isAfter(coupon.getValidTo())) {
            throw new AppException(ErrorCode.COUPON_EXPIRED);
        }

        if (coupon.getMaxUsage() != null && coupon.getCurrentUsage() >= coupon.getMaxUsage()) {
            throw new AppException(ErrorCode.COUPON_USAGE_EXCEEDED);
        }

        if (userId != null) {
            long userUsedCount = couponUsageRepository.countByCoupon_IdAndUser_Id(coupon.getId(), userId);
            if (coupon.getMaxUsagePerUser() != null && userUsedCount >= coupon.getMaxUsagePerUser()) {
                throw new AppException(ErrorCode.COUPON_USAGE_EXCEEDED);
            }
        }

        return coupon;
    }

    @Override
    public List<CouponResponse> getAvailableCouponsForProduct(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        String shopId = product.getShop().getId();
        String userId = currentUserIdOrNull();
        LocalDateTime now = LocalDateTime.now();

        List<Coupon> shopCoupons = couponRepository.findActiveShopCoupons(shopId, now);
        List<Coupon> platformCoupons = couponRepository.findActivePlatformCoupons(now);

        return java.util.stream.Stream.concat(shopCoupons.stream(), platformCoupons.stream())
                .map(c -> toResponseForUser(c, userId))
                .collect(Collectors.toList());
    }

    private String currentUserIdOrNull() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            return null;
        }
        return auth.getName();
    }


    @Override
    @Transactional
    public void incrementUsage(String couponId) {
        couponRepository.incrementUsage(couponId);
        couponRepository.deactivateIfMaxUsageReached(couponId);
    }

    @Override
    @Transactional
    public void deactivate(String couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new AppException(ErrorCode.COUPON_NOT_EXISTS));
        verifyOwnership(coupon);
        coupon.setIsActive(false);
        couponRepository.save(coupon);
    }

    @Override
    @Transactional
    public void deleteCoupon(String couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new AppException(ErrorCode.COUPON_NOT_EXISTS));
        verifyOwnership(coupon);
        couponRepository.delete(coupon);
    }

    private void validateCouponRules(CreateCouponRequest request, boolean isSeller) {
        if (request.getValidFrom() != null && request.getValidTo() != null
                && !request.getValidTo().isAfter(request.getValidFrom())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        String couponTypeRaw = request.getCouponType() == null ? "" : request.getCouponType().toUpperCase();
        String discountTypeRaw = request.getDiscountType() == null ? "" : request.getDiscountType().toUpperCase();

        if ("PRODUCT".equals(couponTypeRaw)) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if ("PLATFORM".equals(couponTypeRaw)
                && request.getShopId() != null && !request.getShopId().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if ("SHOP".equals(couponTypeRaw)
                && (request.getShopId() == null || request.getShopId().isBlank())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (request.getMaxUsage() != null && request.getMaxUsage() <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (request.getMaxUsagePerUser() != null && request.getMaxUsagePerUser() <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        switch (discountTypeRaw) {
            case "PERCENTAGE" -> {
                if (request.getDiscountValue() == null
                        || request.getDiscountValue().compareTo(java.math.BigDecimal.ZERO) <= 0
                        || request.getDiscountValue().compareTo(java.math.BigDecimal.valueOf(100)) > 0) {
                    throw new AppException(ErrorCode.INVALID_REQUEST);
                }
            }
            case "FIXED_AMOUNT" -> {
                if (request.getDiscountValue() == null
                        || request.getDiscountValue().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                    throw new AppException(ErrorCode.INVALID_REQUEST);
                }
            }
            case "FREE_SHIPPING" -> {
                if (request.getDiscountValue() != null
                        && request.getDiscountValue().compareTo(java.math.BigDecimal.ZERO) < 0) {
                    throw new AppException(ErrorCode.INVALID_REQUEST);
                }
            }
            default -> throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }

    private Coupon buildCoupon(CreateCouponRequest request, Shop shop) {
        return Coupon.builder()
                .id(UUID.randomUUID().toString())
                .code(request.getCode())
                .couponType(parseEnum(CouponType.class, request.getCouponType()))
                .discountType(parseEnum(DiscountType.class, request.getDiscountType()))
                .discountValue(request.getDiscountValue())
                .maxDiscount(request.getMaxDiscount())
                .minOrderAmount(request.getMinOrderAmount())
                .maxUsage(request.getMaxUsage())
                .maxUsagePerUser(request.getMaxUsagePerUser() == null ? 1 : request.getMaxUsagePerUser())
                .currentUsage(0)
                .validFrom(request.getValidFrom())
                .validTo(request.getValidTo())
                .description(request.getDescription())
                .isActive(true)
                .shop(shop)
                .build();
    }

    private void verifyOwnership(Coupon coupon) {
        String userId = currentUserId();
        if (coupon.getShop() != null) {
            Shop myShop = shopRepository.findByUser_Id(userId).orElse(null);
            if (myShop == null || !myShop.getId().equals(coupon.getShop().getId())) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
        }
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private CouponResponse toResponse(Coupon coupon) {
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .couponType(coupon.getCouponType() == null ? null : coupon.getCouponType().name())
                .discountType(coupon.getDiscountType() == null ? null : coupon.getDiscountType().name())
                .discountValue(coupon.getDiscountValue())
                .maxDiscount(coupon.getMaxDiscount())
                .minOrderAmount(coupon.getMinOrderAmount())
                .maxUsage(coupon.getMaxUsage())
                .maxUsagePerUser(coupon.getMaxUsagePerUser())
                .currentUsage(coupon.getCurrentUsage())
                .currentUserUsageCount(null)
                .validFrom(coupon.getValidFrom())
                .validTo(coupon.getValidTo())
                .isActive(coupon.getIsActive())
                .description(coupon.getDescription())
                .shopId(coupon.getShop() != null ? coupon.getShop().getId() : null)
                .usedByCurrentUser(null)
                .build();
    }

    private CouponResponse toResponseForUser(Coupon coupon, String userId) {
        if (userId == null) {
            return toResponse(coupon);
        }
        int usedCount = (int) couponUsageRepository.countByCoupon_IdAndUser_Id(coupon.getId(), userId);
        boolean used = coupon.getMaxUsagePerUser() != null
            ? usedCount >= coupon.getMaxUsagePerUser()
            : usedCount > 0;

        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .couponType(coupon.getCouponType() == null ? null : coupon.getCouponType().name())
                .discountType(coupon.getDiscountType() == null ? null : coupon.getDiscountType().name())
                .discountValue(coupon.getDiscountValue())
                .maxDiscount(coupon.getMaxDiscount())
                .minOrderAmount(coupon.getMinOrderAmount())
                .maxUsage(coupon.getMaxUsage())
                .maxUsagePerUser(coupon.getMaxUsagePerUser())
                .currentUsage(coupon.getCurrentUsage())
                .currentUserUsageCount(usedCount)
                .validFrom(coupon.getValidFrom())
                .validTo(coupon.getValidTo())
                .isActive(coupon.getIsActive())
                .description(coupon.getDescription())
                .shopId(coupon.getShop() != null ? coupon.getShop().getId() : null)
                .usedByCurrentUser(used)
                .build();
    }

    private <E extends Enum<E>> E parseEnum(Class<E> type, String raw) {
        if (raw == null) return null;
        String v = raw.trim();
        if (v.isEmpty()) return null;
        try {
            return Enum.valueOf(type, v.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }
}
