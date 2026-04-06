package com.taivs.EcommerceWeb.models.product;

import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "customer_reviews",
        indexes = {
                @Index(name = "idx_product_variant_id", columnList = "product_variant_id"),
                @Index(name = "idx_user_id", columnList = "user_id"),
                @Index(name = "idx_rating", columnList = "rating"),
                @Index(name = "idx_created_at", columnList = "created_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerReview extends BaseEntity {
    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id", nullable = false)
    private ProductVariant productVariant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
