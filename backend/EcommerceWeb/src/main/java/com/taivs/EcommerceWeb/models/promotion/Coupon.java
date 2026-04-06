package com.taivs.EcommerceWeb.models.promotion;

import com.taivs.EcommerceWeb.enums.promotion.CouponType;
import com.taivs.EcommerceWeb.enums.promotion.DiscountType;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons",
        indexes = {
                @Index(name = "idx_code", columnList = "code"),
                @Index(name = "idx_shop_id", columnList = "shop_id"),
                @Index(name = "idx_valid_period", columnList = "valid_from, valid_to"),
                @Index(name = "idx_is_active", columnList = "is_active")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon extends BaseEntity {

    @Id
    @Column(length = 36)
    private String id;

    @Column(length = 50, nullable = false, unique = true)
    private String code;

    @Column(name = "coupon_type", length = 20, nullable = false)
    @Enumerated(EnumType.STRING)
    private CouponType couponType;

    @Column(name = "discount_type", length = 20, nullable = false)
    @Enumerated(EnumType.STRING)
    private DiscountType discountType;

    @Column(name = "discount_value", precision = 15, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "max_discount", precision = 15, scale = 2)
    private BigDecimal maxDiscount;

    @Column(name = "min_order_amount", precision = 15, scale = 2)
    private BigDecimal minOrderAmount;

    @Column(name = "max_usage")
    private Integer maxUsage;

    @Column(name = "max_usage_per_user")
    private Integer maxUsagePerUser = 1;

    @Column(name = "current_usage")
    private Integer currentUsage = 0;

    @Column(name = "valid_from", nullable = false)
    private LocalDateTime validFrom;

    @Column(name = "valid_to", nullable = false)
    private LocalDateTime validTo;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id")
    private Shop shop;

    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return Boolean.TRUE.equals(isActive)
            && !now.isBefore(validFrom)
            && !now.isAfter(validTo)
                && (maxUsage == null || currentUsage < maxUsage);
    }

    public BigDecimal calculateDiscount(BigDecimal orderAmount) {

        if (!isValid() || orderAmount == null) {
            return BigDecimal.ZERO;
        }

        if (minOrderAmount != null &&
                orderAmount.compareTo(minOrderAmount) < 0) {
            return BigDecimal.ZERO;
        }

        if (discountType == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount = BigDecimal.ZERO;

        switch (discountType) {
            case PERCENTAGE -> {
                if (discountValue != null) {
                    discount = orderAmount
                            .multiply(discountValue)
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                    if (maxDiscount != null &&
                            discount.compareTo(maxDiscount) > 0) {
                        discount = maxDiscount;
                    }
                }
            }
            case FIXED_AMOUNT -> {
                if (discountValue != null) {
                    discount = discountValue;
                }
            }
            case FREE_SHIPPING -> {
                discount = BigDecimal.ZERO;
            }
        }

        return discount.min(orderAmount);
    }

}
