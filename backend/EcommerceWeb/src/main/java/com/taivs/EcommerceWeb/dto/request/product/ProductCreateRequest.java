package com.taivs.EcommerceWeb.dto.request.product;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductCreateRequest {
    @NotBlank
    String name;

    String description;
    BigDecimal price;
    String categoryId;

    BigDecimal weight;
    BigDecimal length;
    BigDecimal width;
    BigDecimal height;

    /**
     * Variation groups – Shopee style.
     * e.g. [ { "name": "Màu sắc", "options": [{"name":"Đỏ","imageUrl":"..."},{"name":"Xanh"}] },
     *        { "name": "Kích thước", "options": [{"name":"S"},{"name":"M"},{"name":"L"}] } ]
     */
    @Builder.Default
    List<ProductAttributeRequest> attributes = new ArrayList<>();

    /**
     * Variants – each is a combination of one option per attribute group.
     * e.g. { "optionNames": ["Đỏ","S"], "price": 100000, "stock": 50, "sku": "RED-S" }
     */
    @Builder.Default
    List<ProductVariantRequest> variants = new ArrayList<>();

    /**
     * Semantic keyword tags for Shopee-style search.
     * Seller selects from suggested tags (by category) + can add custom ones.
     * Max 15 tags. e.g. ["áo phông", "áo thun", "áo cotton", "unisex"]
     */
    @Builder.Default
    List<String> tags = new ArrayList<>();
}
