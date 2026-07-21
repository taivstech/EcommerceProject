package com.taivs.EcommerceWeb.dto.response.order;

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
public class CheckoutShopGroupReview {
    String shopId;
    String shopName;
    BigDecimal subtotal;
    BigDecimal shippingFee;
    BigDecimal discountAmount;
    BigDecimal total;
    String warehouseId;
    String warehouseName;
    
    @Builder.Default
    List<CheckoutItemReview> items = new ArrayList<>();
}
