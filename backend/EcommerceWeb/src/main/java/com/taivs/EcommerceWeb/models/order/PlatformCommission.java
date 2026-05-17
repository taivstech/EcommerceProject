package com.taivs.EcommerceWeb.models.order;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Records the platform's revenue from each completed order group.
 *
 * Created when an order's status transitions to COMPLETED.
 *
 * Financial flow:
 *   subtotal (seller earns)
 *   - commissionAmount  → platform keeps this
 *   = netAmount         → seller receives this
 *
 * One PlatformCommission record per OrderShopGroup (a single shop's items
 * within an order). An order with items from 2 shops creates 2 records.
 */
@Entity
@Table(
    name = "platform_commissions",
    indexes = {
        @Index(name = "idx_pc_order_shop_group", columnList = "order_shop_group_id"),
        @Index(name = "idx_pc_shop_id",          columnList = "shop_id"),
        @Index(name = "idx_pc_created_at",        columnList = "created_at"),
        @Index(name = "idx_pc_order_id",          columnList = "order_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformCommission {

    @Id
    @Column(length = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "order_shop_group_id", length = 36, nullable = false)
    private String orderShopGroupId;

    /** Convenience — denormalized from orderShopGroup.order.id */
    @Column(name = "order_id", length = 36, nullable = false)
    private String orderId;

    @Column(name = "shop_id", length = 36, nullable = false)
    private String shopId;

    /** Subtotal of products sold in this group (before shipping, discounts) */
    @Column(name = "gross_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal grossAmount;

    /** Rate snapshot at the time the commission was calculated (e.g. 0.05 = 5%) */
    @Column(name = "commission_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal commissionRate;

    /** grossAmount × commissionRate — what the platform earns */
    @Column(name = "commission_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal commissionAmount;

    /** grossAmount - commissionAmount — what the seller receives */
    @Column(name = "net_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal netAmount;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
