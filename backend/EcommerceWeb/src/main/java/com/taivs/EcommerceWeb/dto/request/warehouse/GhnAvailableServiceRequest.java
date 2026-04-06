package com.taivs.EcommerceWeb.dto.request.warehouse;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GhnAvailableServiceRequest {
    private String shopId;
    private Integer fromDistrictId;
    private Integer toDistrictId;
}
