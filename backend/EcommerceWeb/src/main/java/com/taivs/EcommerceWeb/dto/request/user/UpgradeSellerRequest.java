package com.taivs.EcommerceWeb.dto.request.user;

import com.taivs.EcommerceWeb.models.auth.Role;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpgradeSellerRequest {

    @JsonProperty("shop_id")
    String shopId;

    @JsonProperty("shop_name")
    String shopName;

    @JsonProperty("description")
    String description;
}
