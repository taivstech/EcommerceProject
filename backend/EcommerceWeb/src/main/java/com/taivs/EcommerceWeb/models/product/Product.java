package com.taivs.EcommerceWeb.models.product;

import com.taivs.EcommerceWeb.models.product.Category;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(
        name = "products",
        indexes = {
                @Index(name = "idx_products_shop_id", columnList = "shop_id"),
                @Index(name = "idx_products_category_id", columnList = "category_id"),
                @Index(name = "idx_product_min_price", columnList = "min_price"),
                @Index(name = "idx_product_total_sold", columnList = "total_sold"),
                @Index(name = "idx_product_status", columnList = "is_published, deleted_at"),
                @Index(name = "idx_product_shop_status", columnList = "shop_id, is_draft, is_published")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 100)
    private String brand;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String specifications;

    private BigDecimal weight;
    private BigDecimal length;
    private BigDecimal width;
    private BigDecimal height;

    @Column(nullable = false)
    private BigDecimal minPrice;

    @Column(nullable = false)
    private BigDecimal maxPrice;

    @Column(nullable = false)
    @Builder.Default
    private Long totalSold = 0L;

    @Column(name = "avg_rating", precision = 3, scale = 1)
    private BigDecimal avgRating;

    /** Number of ratings used to compute avgRating. */
    @Column(name = "rating_count")
    private Long ratingCount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Builder.Default
    @OneToMany(
            mappedBy = "product",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private Set<ProductImage> images = new HashSet<>();

    @Builder.Default
    @OneToMany(
            mappedBy = "product",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private Set<ProductVariant> variants = new HashSet<>();

    @Builder.Default
    @OneToMany(
            mappedBy = "product",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private Set<ProductAttribute> attributes = new HashSet<>();

    /**
     * Semantic keyword tags used for Shopee-style search.
     * Tags are separated from product name so a product can be found
     * even if its name doesn't contain the keyword
     * (e.g. "Unisex Graphic Tee" tagged with ["áo phông", "áo thun", "áo cotton"]).
     * Max 15 tags per product (enforced at service layer).
     */
    @Builder.Default
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "product_tags",
            joinColumns = @JoinColumn(name = "product_id"),
            indexes = @Index(name = "idx_product_tags_tag", columnList = "tag")
    )
    @Column(name = "tag", length = 100)
    private List<String> tags = new ArrayList<>();

    @Column(name = "is_draft", nullable = false)
    @Builder.Default
    private boolean isDraft = true;

    @Column(name = "is_published", nullable = false)
    @Builder.Default
    private boolean isPublished = false;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Product that)) return false;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

}
