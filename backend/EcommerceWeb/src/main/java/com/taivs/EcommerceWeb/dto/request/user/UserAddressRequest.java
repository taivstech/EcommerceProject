package com.taivs.EcommerceWeb.dto.request.user;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserAddressRequest {
    @NotBlank
    String receiverName;

    @NotBlank
    String phoneNumber;

    String fullAddress;
    String detailAddress;

    String ward;
    String wardCode;

    String district;
    Integer districtId;

    String province;
    String provinceId;

    boolean defaultAddress;
}
