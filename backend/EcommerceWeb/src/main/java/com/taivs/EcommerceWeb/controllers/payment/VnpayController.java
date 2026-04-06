package com.taivs.EcommerceWeb.controllers.payment;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.services.payment.VnpayService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payment/vnpay")
@RequiredArgsConstructor
public class VnpayController {
    private final VnpayService vnpayService;
    private final OrderRepository orderRepository;

    @PostMapping("/create-payment-url/{orderId}")
    public ApiResponse<String> createPaymentUrl(@PathVariable("orderId") String orderId,
                                                 HttpServletRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTS));
        
        String clientIp = request.getRemoteAddr();
        String paymentUrl = vnpayService.createPaymentUrl(
                orderId, 
                order.getTotal(), 
                "Payment for order " + orderId, 
                clientIp
        );
        return ApiResponse.<String>builder()
                .result(paymentUrl)
                .build();
    }

    @PostMapping("/ipn")
    public ApiResponse<String> vnpayIpn(@RequestParam Map<String, String> params) {
        return vnpayService.vnpayCallback(params);
    }
}
