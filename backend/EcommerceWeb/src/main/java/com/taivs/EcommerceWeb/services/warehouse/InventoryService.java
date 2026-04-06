package com.taivs.EcommerceWeb.services.warehouse;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.dto.warehouse.InventorySummaryDto;
import com.taivs.EcommerceWeb.dto.warehouse.ProductAgingDto;
import com.taivs.EcommerceWeb.dto.warehouse.RecentSaleDto;
import com.taivs.EcommerceWeb.dto.warehouse.StockAlertDto;

import java.util.List;

public interface InventoryService {

    InventorySummaryDto getInventorySummary();

    List<StockAlertDto> getStockAlerts(int threshold);

    List<ProductAgingDto> getProductAging();

    List<RecentSaleDto> getRecentSales(int limit);
}
