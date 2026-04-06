package com.taivs.EcommerceWeb.services.order;

import com.taivs.EcommerceWeb.dto.response.order.OrderResponse;

import java.util.List;

public interface AdminOrderService {

    List<OrderResponse> getAllOrders(String status);

    void adminUpdateOrderStatus(String orderId, String newStatus);

    void deliverOrder(String orderId);
}

