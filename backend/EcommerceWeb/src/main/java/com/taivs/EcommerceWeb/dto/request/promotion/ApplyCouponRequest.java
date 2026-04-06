package com.taivs.EcommerceWeb.dto.request.promotion;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApplyCouponRequest {
    @NotBlank
    private String couponCode;
}
