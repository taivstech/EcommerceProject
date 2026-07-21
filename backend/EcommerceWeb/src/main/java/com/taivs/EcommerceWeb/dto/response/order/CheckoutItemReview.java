package com.taivs.EcommerceWeb.dto.response.order;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckoutItemReview {
    String productId;
    String productName;
    String variantId;
    String variantName;
    String sku;
    String image;
    BigDecimal price;
    Integer quantity;
    BigDecimal lineTotal;
}
