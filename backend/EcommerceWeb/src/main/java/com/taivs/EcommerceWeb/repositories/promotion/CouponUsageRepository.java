package com.taivs.EcommerceWeb.repositories.promotion;

import com.taivs.EcommerceWeb.models.promotion.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CouponUsageRepository
        extends JpaRepository<CouponUsage, String> {

    long countByCoupon_IdAndUser_Id(String couponId, String userId);

    boolean existsByCoupon_IdAndUser_Id(String couponId, String userId);

    Optional<CouponUsage> findByCoupon_IdAndUser_Id(String couponId, String userId);

    void deleteByOrder_Id(String orderId);
}

