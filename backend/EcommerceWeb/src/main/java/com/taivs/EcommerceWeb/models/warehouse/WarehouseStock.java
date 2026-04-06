package com.taivs.EcommerceWeb.models.warehouse;

import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "warehouse_stock",
        indexes = {
                @Index(name = "idx_warehouse_stock_warehouse", columnList = "warehouse_id"),
                @Index(name = "idx_warehouse_stock_variant", columnList = "product_variant_id"),
                @Index(name = "idx_warehouse_stock_warehouse_variant", columnList = "warehouse_id, product_variant_id"),
                @Index(name = "idx_warehouse_stock_deleted", columnList = "deleted_at")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_warehouse_variant", columnNames = {"warehouse_id", "product_variant_id"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseStock extends BaseEntity {

    @Id
    @Column(length = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id", nullable = false)
    private ProductVariant productVariant;

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Long stockQuantity = 0L;

    @Column(name = "reserved_quantity", nullable = false)
    @Builder.Default
    private Long reservedQuantity = 0L;

    /** Computed at runtime — not persisted. stockQuantity - reservedQuantity (floored at 0). */
    public Long getAvailableQuantity() {
        return Math.max(0, stockQuantity - reservedQuantity);
    }

    public boolean hasAvailableStock(Long quantity) {
        return getAvailableQuantity() >= quantity;
    }

    public void reserve(Long quantity) {
        if (!hasAvailableStock(quantity)) {
            throw new IllegalStateException(
                    String.format("Insufficient stock. Available: %d, Requested: %d", getAvailableQuantity(), quantity));
        }
        this.reservedQuantity += quantity;
    }

    public void releaseReservation(Long quantity) {
        this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
    }

    public void ship(Long quantity) {
        if (this.stockQuantity < quantity) {
            throw new IllegalStateException(
                    String.format("Cannot ship more than available. Stock: %d, Requested: %d", this.stockQuantity, quantity));
        }
        if (this.reservedQuantity < quantity) {
            throw new IllegalStateException(
                    String.format("Cannot ship more than reserved. Reserved: %d, Requested: %d", this.reservedQuantity, quantity));
        }
        this.stockQuantity -= quantity;
        this.reservedQuantity -= quantity;
    }
}
