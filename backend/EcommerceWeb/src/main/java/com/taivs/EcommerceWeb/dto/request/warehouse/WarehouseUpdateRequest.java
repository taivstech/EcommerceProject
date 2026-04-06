package com.taivs.EcommerceWeb.dto.request.warehouse;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WarehouseUpdateRequest {
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

    Boolean isDefault;
    String status; // ACTIVE, INACTIVE
}
