package com.taivs.EcommerceWeb.models.order;

import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "order_shop_groups",
        indexes = {
                @Index(name = "idx_order_shop_groups_order_id", columnList = "order_id"),
                @Index(name = "idx_order_shop_groups_shop_id", columnList = "shop_id"),
                @Index(name = "idx_order_shop_groups_warehouse_id", columnList = "warehouse_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderShopGroup extends BaseEntity {
    @Id
    @Column(length = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private BigDecimal total;
    private BigDecimal subtotal;

    @Column(name = "shipping_fee")
    private BigDecimal shippingFee;
    private BigDecimal totalDiscount;

    /**
     * Commission rate applied to this group's subtotal (snapshot at order time).
     * E.g. 0.05 = 5%. Null until the order is COMPLETED and commission is settled.
     */
    @Column(name = "commission_rate", precision = 5, scale = 4)
    private BigDecimal commissionRate;

    /**
     * Platform fee = subtotal × commissionRate.
     * Null until the order is COMPLETED.
     */
    @Column(name = "commission_amount", precision = 15, scale = 2)
    private BigDecimal commissionAmount;

    /**
     * Seller receives: subtotal - commissionAmount.
     * Null until the order is COMPLETED.
     */
    @Column(name = "net_amount", precision = 15, scale = 2)
    private BigDecimal netAmount;

    @Column(length = 20)
    private String shipment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    @NotFound(action = NotFoundAction.IGNORE)
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private Warehouse warehouse;

    @Builder.Default
    @OneToMany(mappedBy = "orderShopGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems = new ArrayList<>();
}

