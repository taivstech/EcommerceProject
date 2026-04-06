package com.taivs.EcommerceWeb.dto.request.warehouse;

import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WarehouseCreateRequest {
    @NotBlank(message = "Warehouse name is required")
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
}
