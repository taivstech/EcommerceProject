package com.taivs.EcommerceWeb.models.shop;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.math.BigDecimal;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopAddress {

    @Column(name = "shop_address_phone_number")
    private String phoneNumber;

    @Column(name = "shop_address_latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "shop_address_longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "shop_address_full", columnDefinition = "TEXT")
    private String fullAddress;

    @Column(name = "shop_address_detail", columnDefinition = "TEXT")
    private String detailAddress;

    @Column(name = "shop_address_ward")
    private String ward;

    @Column(name = "shop_address_ward_code")
    private String wardCode;

    @Column(name = "shop_address_district")
    private String district;

    @Column(name = "shop_address_district_id")
    private Integer districtId;

    @Column(name = "shop_address_province")
    private String province;

    @Column(name = "shop_address_province_id")
    private String provinceId;
}

