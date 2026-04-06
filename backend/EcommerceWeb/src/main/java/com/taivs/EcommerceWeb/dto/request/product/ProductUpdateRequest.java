package com.taivs.EcommerceWeb.dto.request.product;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductUpdateRequest {
    String name;
    String description;
    BigDecimal price;
    String categoryId;

    BigDecimal weight;
    BigDecimal length;
    BigDecimal width;
    BigDecimal height;

    List<ProductAttributeRequest> attributes;

    List<ProductVariantRequest> variants;
}
