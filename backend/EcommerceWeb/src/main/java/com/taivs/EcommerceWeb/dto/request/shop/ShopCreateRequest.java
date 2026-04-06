package com.taivs.EcommerceWeb.dto.request.shop;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShopCreateRequest {
    @NotBlank
    String name;

    String description;

    String fullAddress;
    String province;
    String provinceId;
    String district;
    Integer districtId;
    String ward;
    String wardCode;
    String detailAddress;
}

