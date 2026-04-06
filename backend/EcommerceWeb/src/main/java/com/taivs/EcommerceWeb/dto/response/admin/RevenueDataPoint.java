package com.taivs.EcommerceWeb.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class RevenueDataPoint {
    private String label;
    private BigDecimal revenue;
    private long orderCount;
}
