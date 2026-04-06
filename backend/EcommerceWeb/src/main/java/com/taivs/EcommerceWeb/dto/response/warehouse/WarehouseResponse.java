package com.taivs.EcommerceWeb.dto.response.warehouse;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WarehouseResponse {
    String id;
    String name;
    String contactName;
    String contactPhone;
    String detailAddress;
    String fullAddress;

    String ward;
    String wardCode;
    String district;
    Integer districtId;
    String province;
    String provinceId;

    Integer ghnShopId;
    String status;
    Boolean isDefault;

    String shopId;
    String shopName;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    List<WarehouseEmployeeResponse> employees;
}
