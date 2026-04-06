package com.taivs.EcommerceWeb.models.product;

import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Comparator;

@Entity
@Table(name = "product_variants",
        indexes = {
                @Index(name = "idx_product_variants_product_id", columnList = "product_id"),
                @Index(name = "idx_product_variants_status", columnList = "status")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant extends BaseEntity {
    @Id
    @Column(length = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(length = 200)
    private String name;

    @Column(length = 100)
    private String sku;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    private Long stock;

    @Column(name = "sold_count")
    @Builder.Default
    private Long soldCount = 0L;

    @Column(length = 20)
    private String status;

    /** Convenience field — always points to the current isMain image URL (or first image). */
    @Column(length = 500)
    private String imageUrl;

    @Builder.Default
    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductVariantImage> images = new ArrayList<>();

    /** Returns the representative (main) image URL, falling back to imageUrl if images list is empty. */
    @Transient
    public String getMainImageUrl() {
        return images.stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                .map(ProductVariantImage::getUrl)
                .findFirst()
                .orElse(images.isEmpty() ? imageUrl
                        : images.stream().min(Comparator.comparing(ProductVariantImage::getCreatedAt))
                                .map(ProductVariantImage::getUrl).orElse(imageUrl));
    }

    private BigDecimal weight;
    private BigDecimal length;
    private BigDecimal width;
    private BigDecimal height;

    @Builder.Default
    @ManyToMany
    @JoinTable(
            name = "product_variant_detail_attributes",
            joinColumns = @JoinColumn(name = "product_variant_id"),
            inverseJoinColumns = @JoinColumn(name = "detail_attribute_id")
    )
    private Set<DetailAttribute> detailAttributes = new HashSet<>();


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProductVariant that)) return false;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

}

