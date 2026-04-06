package com.taivs.EcommerceWeb.serviceimpl.payment;

import com.taivs.EcommerceWeb.enums.order.PaymentMethod;
import com.taivs.EcommerceWeb.services.payment.PaymentGateway;
import com.taivs.EcommerceWeb.services.payment.PaymentService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {
    
    private final List<PaymentGateway> paymentGateways;

    @Override
    public String createPaymentUrl(String paymentMethod, String orderId, BigDecimal amount, String orderInfo, String clientIp) {
        PaymentGateway gateway = getGateway(paymentMethod);
        return gateway.createPaymentUrl(orderId, amount, orderInfo, clientIp);
    }

    @Override
    @Transactional
    public ApiResponse<String> handleCallback(String paymentMethod, Map<String, String> params) {
        PaymentGateway gateway = getGateway(paymentMethod);
        return gateway.handleCallback(params);
    }

    @Override
    public List<String> getAvailablePaymentMethods() {
        return paymentGateways.stream()
                .map(PaymentGateway::getPaymentMethod)
                .toList();
    }

    private PaymentGateway getGateway(String paymentMethod) {
        return paymentGateways.stream()
                .filter(gateway -> gateway.getPaymentMethod().equalsIgnoreCase(paymentMethod))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_METHOD_NOT_SUPPORTED));
    }
}
