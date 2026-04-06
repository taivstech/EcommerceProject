package com.taivs.EcommerceWeb.dto.response.promotion;

import com.taivs.EcommerceWeb.enums.promotion.CouponType;
import com.taivs.EcommerceWeb.enums.promotion.DiscountType;
import com.taivs.EcommerceWeb.models.promotion.Coupon;
import com.taivs.EcommerceWeb.models.user.User;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class CouponResponse {
    private String id;
    private String code;
    private String couponType;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscount;
    private BigDecimal minOrderAmount;
    private Integer maxUsage;
    private Integer maxUsagePerUser;
    private Integer currentUsage;
    private Integer currentUserUsageCount;
    private LocalDateTime validFrom;
    private LocalDateTime validTo;
    private Boolean isActive;
    private String description;
    private String shopId;
    private Boolean usedByCurrentUser;
}
