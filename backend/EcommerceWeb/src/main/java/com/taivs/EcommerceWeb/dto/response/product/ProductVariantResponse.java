package com.taivs.EcommerceWeb.dto.response.product;

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
public class ProductVariantResponse {
    String id;
    String name;
    String sku;
    BigDecimal price;
    Long stock;
    Long soldCount;
    String status;

    @Builder.Default
    List<DetailAttributeResponse> detailAttributes = new ArrayList<>();

    /** Convenience: URL of the isMain image (null if no images uploaded yet). */
    String imageUrl;

    /** All images belonging to this variant. */
    @Builder.Default
    List<ProductImageResponse> images = new ArrayList<>();
}
