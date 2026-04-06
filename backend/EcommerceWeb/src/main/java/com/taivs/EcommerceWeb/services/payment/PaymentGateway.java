package com.taivs.EcommerceWeb.services.payment;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.dto.ApiResponse;

import java.math.BigDecimal;
import java.util.Map;

public interface PaymentGateway {
    
    /**
     * Create payment URL for redirecting user to payment provider
     * @param orderId Order ID
     * @param amount Payment amount
     * @param orderInfo Order description
     * @param clientIp Client IP address
     * @return Payment URL
     */
    String createPaymentUrl(String orderId, BigDecimal amount, String orderInfo, String clientIp);
    
    /**
     * Handle payment callback from payment provider
     * @param params Callback parameters (query params or request body)
     * @return API response with payment status
     */
    ApiResponse<String> handleCallback(Map<String, String> params);
    
    /**
     * Get payment method name (VNPAY, PAYPAL, MOMO)
     * @return Payment method enum value
     */
    String getPaymentMethod();
}
