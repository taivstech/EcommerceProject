package com.taivs.EcommerceWeb.dto.response.order;

import com.taivs.EcommerceWeb.models.product.ProductImage;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReturnRequestResponse {
    String id;
    String orderId;
    String orderItemId;
    String productName;
    String productImage;
    String variantName;
    int quantity;
    BigDecimal price;
    String userId;
    String username;
    String status;
    String reason;
    String description;
    String evidenceImages;
    BigDecimal refundAmount;
    String sellerResponse;
    LocalDateTime createdAt;
    LocalDateTime resolvedAt;
}
