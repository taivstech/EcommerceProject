package com.taivs.EcommerceWeb.services.warehouse;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.dto.request.order.CheckoutRequest;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface WarehouseSelectionService {

    record WarehouseSelectionResult(
            Warehouse warehouse,
            BigDecimal shippingFee,
            Map<String, Long> itemQuantities,
            boolean isSplit
    ) {}

    List<WarehouseSelectionResult> selectWarehouses(
            String shopId,
            Map<String, Long> items,
            CheckoutRequest request,
            BigDecimal totalWeight
    );

    boolean hasTotalSufficientStock(String shopId, Map<String, Long> items);
}
