package com.taivs.EcommerceWeb.services.promotion;

import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.dto.request.promotion.CreateCouponRequest;
import com.taivs.EcommerceWeb.dto.response.promotion.CouponResponse;
import com.taivs.EcommerceWeb.models.promotion.Coupon;
import com.taivs.EcommerceWeb.enums.promotion.CouponType;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface CouponService {

    CouponResponse create(CreateCouponRequest request);

    CouponResponse createByShopOwner(CreateCouponRequest request);

    List<CouponResponse> getAvailablePlatformCoupons();

    List<CouponResponse> getAvailableShopCoupons(String shopId);

    List<CouponResponse> getMyShopCoupons();

    List<CouponResponse> getAllCoupons();

    CouponResponse getByCouponCode(String code);

    Coupon validateAndLock(String couponCode, String userId, CouponType expectedType);

    Coupon validateCoupon(String couponCode, String userId, CouponType expectedType);

    List<CouponResponse> getAvailableCouponsForProduct(String productId);

    void incrementUsage(String couponId);

    void deactivate(String couponId);

    void deleteCoupon(String couponId);
}
