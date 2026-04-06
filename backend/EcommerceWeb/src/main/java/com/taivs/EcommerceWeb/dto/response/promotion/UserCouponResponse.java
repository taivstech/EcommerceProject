package com.taivs.EcommerceWeb.dto.response.promotion;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCouponResponse {
    String userId;
    String couponId;
}

