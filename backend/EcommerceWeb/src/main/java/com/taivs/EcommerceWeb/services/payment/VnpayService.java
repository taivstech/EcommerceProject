package com.taivs.EcommerceWeb.services.payment;

import com.taivs.EcommerceWeb.dto.ApiResponse;

import java.math.BigDecimal;
import java.util.Map;

public interface VnpayService {

    String createPaymentUrl(String orderId, BigDecimal amount, String orderInfo, String clientIp);

    ApiResponse<String> vnpayCallback(Map<String, String> params);
}
