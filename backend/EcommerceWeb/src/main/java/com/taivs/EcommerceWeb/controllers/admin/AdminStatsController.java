package com.taivs.EcommerceWeb.controllers.admin;

import com.taivs.EcommerceWeb.dto.response.admin.CategoryRevenueStats;
import com.taivs.EcommerceWeb.dto.response.admin.DashboardStats;
import com.taivs.EcommerceWeb.dto.response.admin.RevenueDataPoint;
import com.taivs.EcommerceWeb.dto.response.admin.TopProductStats;
import com.taivs.EcommerceWeb.dto.response.admin.UserGrowthDataPoint;
import com.taivs.EcommerceWeb.services.admin.AdminStatsService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {
        private final AdminStatsService adminStatsService;

        @GetMapping("/dashboard")
        @PreAuthorize("hasRole('ADMIN')")
        public ApiResponse<DashboardStats> getDashboard() {
                return ApiResponse.<DashboardStats>builder()
                                .result(adminStatsService.getDashboardStats())
                                .build();
        }

        @GetMapping("/revenue-chart")
        @PreAuthorize("hasRole('ADMIN')")
        public ApiResponse<List<RevenueDataPoint>> revenueChart(
                        @RequestParam(defaultValue = "30") int days) {
                return ApiResponse.<List<RevenueDataPoint>>builder()
                                .result(adminStatsService.getRevenueChart(days))
                                .build();
        }

        @GetMapping("/revenue-chart/monthly")
        @PreAuthorize("hasRole('ADMIN')")
        public ApiResponse<List<RevenueDataPoint>> monthlyRevenueChart(
                        @RequestParam(defaultValue = "12") int months) {
                return ApiResponse.<List<RevenueDataPoint>>builder()
                                .result(adminStatsService.getMonthlyRevenueChart(months))
                                .build();
        }

        @GetMapping("/top-products")
        @PreAuthorize("hasRole('ADMIN')")
        public ApiResponse<List<TopProductStats>> topProducts(
                        @RequestParam(defaultValue = "30") int days,
                        @RequestParam(defaultValue = "10") int limit) {
                return ApiResponse.<List<TopProductStats>>builder()
                                .result(adminStatsService.getTopProducts(days, limit))
                                .build();
        }

        @GetMapping("/user-growth")
        @PreAuthorize("hasRole('ADMIN')")
        public ApiResponse<List<UserGrowthDataPoint>> userGrowth(
                        @RequestParam(defaultValue = "30") int days) {
                return ApiResponse.<List<UserGrowthDataPoint>>builder()
                                .result(adminStatsService.getUserGrowth(days))
                                .build();
        }

        @GetMapping("/order-status")
        @PreAuthorize("hasRole('ADMIN')")
        public ApiResponse<Map<String, Long>> orderStatusDistribution() {
                return ApiResponse.<Map<String, Long>>builder()
                                .result(adminStatsService.getOrderStatusDistribution())
                                .build();
        }

        @GetMapping("/category-revenue")
        @PreAuthorize("hasRole('ADMIN')")
        public ApiResponse<List<CategoryRevenueStats>> categoryRevenue(
                        @RequestParam(defaultValue = "30") int days) {
                return ApiResponse.<List<CategoryRevenueStats>>builder()
                                .result(adminStatsService.getCategoryRevenue(days))
                                .build();
        }
}
