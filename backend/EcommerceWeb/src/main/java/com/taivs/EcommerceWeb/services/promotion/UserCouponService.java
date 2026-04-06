package com.taivs.EcommerceWeb.services.promotion;

import com.taivs.EcommerceWeb.dto.response.promotion.UserCouponResponse;

import java.util.List;

public interface UserCouponService {

    List<UserCouponResponse> getMyCoupons();

    List<UserCouponResponse> getByUsername(String username);
}
