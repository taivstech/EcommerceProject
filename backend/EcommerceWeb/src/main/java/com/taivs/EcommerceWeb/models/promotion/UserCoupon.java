package com.taivs.EcommerceWeb.models.promotion;

import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import com.taivs.EcommerceWeb.models.user.User;

/**
 * Based on identity-service UserCoupon (Mongo).
 * In monolith we store the mapping in a relational table `user_coupons`.
 */
@Entity
@Table(name = "user_coupons",
        indexes = {
                @Index(name = "idx_user_coupons_user_id", columnList = "user_id"),
                @Index(name = "idx_user_coupons_coupon_id", columnList = "coupon_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCoupon extends BaseEntity {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "coupon_id", nullable = false, length = 36)
    private String couponId;

    @Column(name = "used")
    private Boolean used = false;
}

