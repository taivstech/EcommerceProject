package com.taivs.EcommerceWeb.models.order;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Configures the platform commission rate.
 *
 * Rules:
 * - If categoryId is NULL → this is the global default rate (applies to all categories).
 * - If categoryId is set   → this overrides the default for that specific category.
 * - Only one active rate per categoryId should exist at any time.
 *
 * Example:
 *   categoryId = null, rate = 0.05  → 5% default for all
 *   categoryId = "electronics-id",  rate = 0.03  → 3% override for Electronics
 */
@Entity
@Table(
    name = "commission_rates",
    indexes = {
        @Index(name = "idx_cr_category_active", columnList = "category_id, is_active"),
        @Index(name = "idx_cr_effective_from",  columnList = "effective_from")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommissionRate {

    @Id
    @Column(length = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /**
     * Category this rate applies to. NULL = global default.
     */
    @Column(name = "category_id", length = 36)
    private String categoryId;

    /**
     * Category name (denormalized for display without JOIN).
     */
    @Column(name = "category_name", length = 100)
    private String categoryName;

    /**
     * Commission rate as a decimal, e.g. 0.05 = 5%.
     * Valid range: [0.00, 0.50]
     */
    @Column(name = "rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal rate;

    /**
     * Human-readable description, e.g. "Standard 5% platform fee"
     */
    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "effective_from")
    private LocalDateTime effectiveFrom;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Created by admin user ID */
    @Column(name = "created_by", length = 36)
    private String createdBy;
}
