package com.taivs.EcommerceWeb.dto.response.shop;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ShopFollowerResponse {
    private String id;
    private String shopId;
    private String shopName;
    private LocalDateTime followedAt;
}
