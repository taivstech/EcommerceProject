package com.taivs.EcommerceWeb.services.order;

import com.taivs.EcommerceWeb.dto.request.order.CheckoutRequest;
import com.taivs.EcommerceWeb.dto.response.order.OrderResponse;

import java.util.List;

public interface BuyerOrderService {

    List<OrderResponse> getMyOrders();

    OrderResponse getMyOrderById(String orderId);

    OrderResponse checkout(CheckoutRequest request);

    void cancelMyOrder(String orderId, String reason);

    void confirmReceipt(String orderId);
}

