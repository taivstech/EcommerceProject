package com.taivs.EcommerceWeb.dto.response.cart;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartItemResponse {
    String id;
    Integer quantity;
    LocalDateTime addedAt;

    String productVariantId;
    String productId;
    String shopId;
}

