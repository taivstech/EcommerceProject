package com.taivs.EcommerceWeb.dto.warehouse;

import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RecentSaleDto {
    String orderId;
    String productId;
    String productName;
    String variantName;
    Long quantity;
    BigDecimal unitPrice;
    BigDecimal totalAmount;
    LocalDateTime orderDate;
    String orderStatus;
    String buyerName;
}
