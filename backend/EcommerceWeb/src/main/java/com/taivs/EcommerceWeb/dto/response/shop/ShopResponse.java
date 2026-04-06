package com.taivs.EcommerceWeb.dto.response.shop;

import com.taivs.EcommerceWeb.models.shop.ShopAddress;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShopResponse {
    String id;
    String name;
    String description;
    String logo;
    String address;
    String status;
    String rejectionReason;
    LocalDateTime approvedAt;
    String approvedBy;
    LocalDateTime createdAt;
    String userId;
    ShopAddressResponse shopAddress;
}

