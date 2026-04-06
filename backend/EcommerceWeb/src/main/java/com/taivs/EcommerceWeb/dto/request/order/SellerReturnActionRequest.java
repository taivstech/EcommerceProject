package com.taivs.EcommerceWeb.dto.request.order;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SellerReturnActionRequest {
    String action;
    String sellerResponse;
}
