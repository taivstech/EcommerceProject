package com.taivs.EcommerceWeb.dto.response.admin;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class CommissionRevenueResponse {
    private BigDecimal totalRevenue;
    private BigDecimal totalGmv;           // Gross Merchandise Value
    private BigDecimal avgCommissionRate;
    private long totalSettledOrders;
    private int days;

    /** Daily breakdown for chart */
    private List<DailyRevenue> dailyBreakdown;

    @Data
    @Builder
    public static class DailyRevenue {
        private String date;
        private BigDecimal revenue;
    }
}
