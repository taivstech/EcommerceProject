package com.taivs.EcommerceWeb.dto.response.order;

import com.taivs.EcommerceWeb.models.order.ShippingAddress;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponse {
    String id;
    OrderStatus status;
    String payment;
    Boolean isPaid;
    String note;
    BigDecimal subtotal;
    BigDecimal shippingFee;
    BigDecimal discountAmount;
    BigDecimal shopDiscountAmount;
    BigDecimal shippingDiscountAmount;
    BigDecimal totalDiscount;
    BigDecimal total;
    LocalDateTime createdAt;

    ShippingAddressResponse shippingAddress;

    @Builder.Default
    List<OrderShopGroupResponse> shopGroups = new ArrayList<>();
}

