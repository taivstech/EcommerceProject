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
public class CheckoutReviewResponse {
    BigDecimal subtotal;
    BigDecimal shippingFee;
    BigDecimal discountAmount;
    BigDecimal totalPay;
    
    @Builder.Default
    List<CheckoutShopGroupReview> shopGroups = new ArrayList<>();
}
