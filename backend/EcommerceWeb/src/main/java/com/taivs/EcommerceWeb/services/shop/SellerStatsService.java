package com.taivs.EcommerceWeb.services.shop;

import com.taivs.EcommerceWeb.dto.response.shop.SellerTopCustomerStats;

import java.time.LocalDate;
import java.util.List;

public interface SellerStatsService {
    List<SellerTopCustomerStats> getTopCustomers(LocalDate from, LocalDate to, int limit);
}
