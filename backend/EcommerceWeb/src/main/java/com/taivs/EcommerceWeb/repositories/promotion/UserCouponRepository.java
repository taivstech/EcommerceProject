package com.taivs.EcommerceWeb.repositories.promotion;

import com.taivs.EcommerceWeb.models.promotion.UserCoupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserCouponRepository extends JpaRepository<UserCoupon, String> {
    List<UserCoupon> findByUser_Id(String userId);
}

