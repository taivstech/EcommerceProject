package com.taivs.EcommerceWeb.dto.response.admin;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class DashboardStats {
    private Long totalUsers;
    private Long totalShops;
    private Long totalProducts;
    private Long totalOrders;
    private BigDecimal totalRevenue;
    
    private Long pendingShops;
    private Long pendingProducts;
    private Long pendingOrders;
    
    private Long activeUsers;
    private Long approvedShops;
    private Long approvedProducts;
}
