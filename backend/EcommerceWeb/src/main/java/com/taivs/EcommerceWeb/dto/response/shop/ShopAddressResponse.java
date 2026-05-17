package com.taivs.EcommerceWeb.dto.response.shop;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class ShopAddressResponse {
    private String id;
    private String phoneNumber;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String fullAddress;
    private String detailAddress;
    private String ward;
    private String wardCode;
    private String district;
    private Integer districtId;
    private String province;
    private String provinceId;
}
