package com.taivs.EcommerceWeb.services.order;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.dto.response.order.OrderResponse;

import java.util.List;

public interface WarehouseEmployeeOrderService {

    List<OrderResponse> getMyWarehouseOrders();

    OrderResponse getWarehouseOrderById(String orderId);

    void confirmPacking(String orderId);

    void markShipped(String orderId);
}
