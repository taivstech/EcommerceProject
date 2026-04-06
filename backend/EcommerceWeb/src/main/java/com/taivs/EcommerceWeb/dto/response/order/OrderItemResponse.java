package com.taivs.EcommerceWeb.dto.response.order;

import com.taivs.EcommerceWeb.models.product.ProductImage;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.ALWAYS)
public class OrderItemResponse {
    @JsonProperty("id")
    String id;
    String productVariantId;
    Integer quantity;
    BigDecimal price;

    String productId;
    String productName;
    String productImage;
    String variantName;
    String variantSku;

    Boolean hasReview;
}
