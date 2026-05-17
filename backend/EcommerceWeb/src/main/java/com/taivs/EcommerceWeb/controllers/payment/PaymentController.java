package com.taivs.EcommerceWeb.controllers.payment;

import com.taivs.EcommerceWeb.enums.order.PaymentMethod;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.services.payment.PaymentService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {
    private final PaymentService paymentService;
    private final OrderRepository orderRepository;

    @PostMapping("/create-payment-url/{paymentMethod}/{orderId}")
    public ApiResponse<String> createPaymentUrl(
            @PathVariable("paymentMethod") String paymentMethod,
            @PathVariable("orderId") String orderId,
            HttpServletRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTS));

        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!order.getUser().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        String clientIp = request.getRemoteAddr();
        String paymentUrl = paymentService.createPaymentUrl(
                paymentMethod.toUpperCase(),
                orderId,
                order.getTotal(),
                "Payment for order " + orderId,
                clientIp);

        return ApiResponse.<String>builder()
                .result(paymentUrl)
                .build();
    }

    @GetMapping("/callback/{paymentMethod}")
    public ApiResponse<String> handleCallback(
            @PathVariable("paymentMethod") String paymentMethod,
            @RequestParam Map<String, String> params) {
        log.info("PaymentController.handleCallback - paymentMethod: {}, params count: {}",
                paymentMethod, params.size());
        return paymentService.handleCallback(paymentMethod.toUpperCase(), params);
    }

    @PostMapping("/callback/{paymentMethod}")
    public ApiResponse<String> handleCallbackPost(
            @PathVariable("paymentMethod") String paymentMethod,
            @RequestParam(required = false) Map<String, String> params,
            @RequestBody(required = false) Map<String, Object> body) {
        Map<String, String> callbackParams = new HashMap<>();

        if (params != null) {
            callbackParams.putAll(params);
        }
        if (body != null) {
            body.forEach((k, v) -> callbackParams.put(k, v != null ? v.toString() : ""));
        }

        return paymentService.handleCallback(paymentMethod.toUpperCase(), callbackParams);
    }

    @GetMapping("/methods")
    public ApiResponse<List<String>> getAvailablePaymentMethods() {
        return ApiResponse.<List<String>>builder()
                .result(paymentService.getAvailablePaymentMethods())
                .build();
    }
}
