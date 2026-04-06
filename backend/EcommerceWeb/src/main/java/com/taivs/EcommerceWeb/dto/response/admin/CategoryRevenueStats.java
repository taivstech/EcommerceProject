package com.taivs.EcommerceWeb.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class CategoryRevenueStats {
    private String categoryId;
    private String categoryName;
    private long orderCount;
    private BigDecimal revenue;
}
