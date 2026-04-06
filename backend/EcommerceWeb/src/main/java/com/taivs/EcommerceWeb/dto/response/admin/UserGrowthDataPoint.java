package com.taivs.EcommerceWeb.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class UserGrowthDataPoint {
    private String label;
    private long newUsers;
    private long cumulativeTotal;
}
