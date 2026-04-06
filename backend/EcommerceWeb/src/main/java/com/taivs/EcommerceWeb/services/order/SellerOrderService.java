package com.taivs.EcommerceWeb.services.order;

import com.taivs.EcommerceWeb.dto.response.order.OrderResponse;

import java.util.List;

public interface SellerOrderService {

    List<OrderResponse> getMyShopOrders();

    OrderResponse getShopOrderById(String orderId);

    void confirmOrder(String orderId);

    void shipOrder(String orderId);

    void deliverOrder(String orderId);

    void cancelOrder(String orderId, String reason);
}

