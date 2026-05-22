package com.taivs.EcommerceWeb.dto.response.shop;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;

@Getter
@Builder
public class SellerDashboardStats {
    private Long totalProducts;
    private Long totalOrders;
    private Long totalFollowers;
    private BigDecimal totalGmv;
    private BigDecimal totalEarnings;
    private BigDecimal totalCommission;
}
