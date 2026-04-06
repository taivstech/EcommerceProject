package com.taivs.EcommerceWeb.dto.response.order;

import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
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
public class OrderShopGroupResponse {
    String id;
    String shopId;
    BigDecimal subtotal;
    BigDecimal shippingFee;
    BigDecimal totalDiscount;
    BigDecimal total;
    String shipment;

    String warehouseId;
    String warehouseName;

    @Builder.Default
    List<OrderItemResponse> items = new ArrayList<>();
}

