package com.taivs.EcommerceWeb.services.order;

import com.taivs.EcommerceWeb.dto.response.admin.CommissionRateResponse;
import com.taivs.EcommerceWeb.dto.response.admin.CommissionRevenueResponse;
import com.taivs.EcommerceWeb.dto.request.admin.CommissionRateRequest;
import com.taivs.EcommerceWeb.models.order.OrderShopGroup;

import java.math.BigDecimal;
import java.util.List;

public interface CommissionService {

    /** Resolve the commission rate for a given category ID (null-safe, returns default if no override). */
    BigDecimal resolveRate(String categoryId);

    /**
     * Calculate and persist commission records for all groups in a completed order.
     * Called when order status transitions to COMPLETED.
     *
     * @param orderId the completed order's ID
     */
    void settleOrderCommission(String orderId);

    /** Admin: list all commission rates */
    List<CommissionRateResponse> listRates();

    /** Admin: create or update a commission rate */
    CommissionRateResponse upsertRate(CommissionRateRequest request);

    /** Admin: deactivate a rate */
    void deactivateRate(String rateId);

    /** Admin: platform revenue summary */
    CommissionRevenueResponse getRevenueSummary(int days);
}
