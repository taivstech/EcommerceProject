package com.taivs.EcommerceWeb.services.payment;

import com.taivs.EcommerceWeb.enums.order.PaymentMethod;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.dto.ApiResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface PaymentService {

    String createPaymentUrl(String paymentMethod, String orderId, BigDecimal amount, String orderInfo, String clientIp);

    ApiResponse<String> handleCallback(String paymentMethod, Map<String, String> params);

    List<String> getAvailablePaymentMethods();
}
