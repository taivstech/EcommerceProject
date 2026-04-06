package com.taivs.EcommerceWeb.controllers.promotion;

import com.taivs.EcommerceWeb.dto.response.promotion.UserCouponResponse;
import com.taivs.EcommerceWeb.services.promotion.UserCouponService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users/me/coupons")
@RequiredArgsConstructor
public class UserCouponController {
    private final UserCouponService userCouponService;

    @GetMapping
    public ApiResponse<List<UserCouponResponse>> getMyCoupons() {
        return ApiResponse.<List<UserCouponResponse>>builder()
                .result(userCouponService.getMyCoupons())
                .build();
    }
}

