package com.taivs.EcommerceWeb.services.admin;

import com.taivs.EcommerceWeb.dto.response.admin.CategoryRevenueStats;
import com.taivs.EcommerceWeb.dto.response.admin.DashboardStats;
import com.taivs.EcommerceWeb.dto.response.admin.RevenueDataPoint;
import com.taivs.EcommerceWeb.dto.response.admin.TopProductStats;
import com.taivs.EcommerceWeb.dto.response.admin.UserGrowthDataPoint;

import java.util.List;
import java.util.Map;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.user.User;

public interface AdminStatsService {

    DashboardStats getDashboardStats();

    List<RevenueDataPoint> getRevenueChart(int days);

    List<RevenueDataPoint> getMonthlyRevenueChart(int months);

    List<TopProductStats> getTopProducts(int days, int limit);

    List<UserGrowthDataPoint> getUserGrowth(int days);

    Map<String, Long> getOrderStatusDistribution();

    List<CategoryRevenueStats> getCategoryRevenue(int days);
}
