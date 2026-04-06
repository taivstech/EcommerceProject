package com.taivs.EcommerceWeb.dto.request.promotion;

import com.taivs.EcommerceWeb.enums.promotion.CouponType;
import com.taivs.EcommerceWeb.enums.promotion.DiscountType;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.shop.Shop;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class CreateCouponRequest {
    @NotBlank
    private String code;

    @NotBlank
    private String couponType;

    @NotBlank
    private String discountType;

    private BigDecimal discountValue;
    private BigDecimal maxDiscount;
    private BigDecimal minOrderAmount;
    private Integer maxUsage;
    private Integer maxUsagePerUser;

    @NotNull
    private LocalDateTime validFrom;

    @NotNull
    private LocalDateTime validTo;

    private String description;
    private String shopId;
}
