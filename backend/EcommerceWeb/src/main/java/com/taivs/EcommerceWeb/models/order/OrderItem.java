package com.taivs.EcommerceWeb.models.order;

import com.taivs.EcommerceWeb.models.product.CustomerReview;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_items",
        indexes = {
                @Index(name = "idx_order_items_group_id", columnList = "order_shop_group_id"),
                @Index(name = "idx_order_items_variant_id", columnList = "product_variant_id"),
                @Index(name = "idx_order_items_product_id", columnList = "product_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem extends BaseEntity {
    @Id
    @Column(length = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "product_id", length = 36)
    private String productId;

    @Column(name = "product_name", length = 200)
    private String productName;

    @Column(name = "product_image", length = 500)
    private String productImage;

    @Column(name = "variant_name", length = 200)
    private String variantName;

    @Column(name = "variant_sku", length = 100)
    private String variantSku;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_shop_group_id", nullable = false)
    private OrderShopGroup orderShopGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id", nullable = false)
    @NotFound(action = NotFoundAction.IGNORE)
    private ProductVariant productVariant;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "customer_review_id")
    private CustomerReview customerReview;

    public String getProductVariantIdSafely() {
        try {
            if (this.productVariant != null) {
                return this.productVariant.getId();
            }
        } catch (Exception e) {
            // Catch EntityNotFoundException / ObjectNotFoundException for dangling DB references
        }
        return null;
    }
}

