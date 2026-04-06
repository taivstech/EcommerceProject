package com.taivs.EcommerceWeb.serviceimpl.payment;

import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.config.integration.MoMoConfig;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import com.taivs.EcommerceWeb.models.order.OrderShopGroup;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.services.payment.PaymentGateway;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.repositories.product.ProductVariantRepository;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseStockService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MoMoServiceImpl implements PaymentGateway {
    private final MoMoConfig moMoConfig;
    private final OrderRepository orderRepository;
    private final ProductVariantRepository productVariantRepository;
    private final WarehouseStockService warehouseStockService;
    private final RestTemplate restTemplate;

    @Override
    public String createPaymentUrl(String orderId, BigDecimal amount, String orderInfo, String clientIp) {
        try {
            // MoMo expects amount in VND (whole number, no cents multiplication)
            long amountLong = amount.longValue();
            String requestId = UUID.randomUUID().toString();
            String requestType = "captureWallet";
            String redirectUrl = moMoConfig.getReturnUrl() + "?orderId=" + orderId + "&gateway=momo";

            String rawSignature = "accessKey=" + moMoConfig.getAccessKey() +
                    "&amount=" + amountLong +
                    "&extraData=" +
                    "&ipnUrl=" + moMoConfig.getNotifyUrl() +
                    "&orderId=" + orderId +
                    "&orderInfo=" + orderInfo +
                    "&partnerCode=" + moMoConfig.getPartnerCode() +
                    "&redirectUrl=" + redirectUrl +
                    "&requestId=" + requestId +
                    "&requestType=" + requestType;

            String signature = hmacSHA256(moMoConfig.getSecretKey(), rawSignature);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("partnerCode", moMoConfig.getPartnerCode());
            requestBody.put("partnerName", "EcommerceWeb");
            requestBody.put("storeId", moMoConfig.getPartnerCode());
            requestBody.put("requestId", requestId);
            requestBody.put("amount", amountLong);
            requestBody.put("orderId", orderId);
            requestBody.put("orderInfo", orderInfo);
            requestBody.put("redirectUrl", redirectUrl);
            requestBody.put("ipnUrl", moMoConfig.getNotifyUrl());
            requestBody.put("lang", "vi");
            requestBody.put("extraData", "");
            requestBody.put("requestType", requestType);
            requestBody.put("signature", signature);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(moMoConfig.getPaymentUrl(), request, 
                    (Class<Map<String, Object>>) (Class<?>) Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                Integer resultCode = (Integer) responseBody.get("resultCode");
                
                if (resultCode != null && resultCode == 0) {
                    return (String) responseBody.get("payUrl");
                } else {
                    String message = (String) responseBody.get("message");
                    log.error("MoMo payment creation failed: {}", message);
                    throw new RuntimeException("MoMo payment creation failed: " + message);
                }
            }
            throw new RuntimeException("Failed to create MoMo payment");
        } catch (Exception e) {
            log.error("Failed to create MoMo payment URL for order: {}", orderId, e);
            throw new AppException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
    }

    @Override
    @Transactional
    public ApiResponse<String> handleCallback(Map<String, String> params) {
        String orderId = params.get("orderId");
        String resultCode = params.get("resultCode");
        String message = params.get("message");

        if (orderId == null || resultCode == null) {
            return ApiResponse.<String>builder()
                    .code(400)
                    .message("Missing required parameters")
                    .result("FAILED")
                    .build();
        }

        if (!verifyMoMoSignature(params)) {
            log.error("MoMo callback signature verification failed for order: {}", orderId);
            return ApiResponse.<String>builder()
                    .code(400)
                    .message("Invalid signature")
                    .result("FAILED")
                    .build();
        }

        try {
            if ("0".equals(resultCode)) {

                Order order = orderRepository.findByIdForUpdate(orderId).orElseThrow(
                        () -> new AppException(ErrorCode.ORDER_NOT_EXISTS)
                );


                if (Boolean.TRUE.equals(order.getIsPaid())) {
                    log.info("MoMo duplicate callback ignored — order {} already paid", orderId);
                    return ApiResponse.<String>builder()
                            .code(1000)
                            .message("Payment already processed for order: " + orderId)
                            .result("SUCCESS")
                            .build();
                }

                decreaseStockForOrder(order);
                
                order.changeStatus(OrderStatus.PENDING);
                order.setIsPaid(true);
                orderRepository.save(order);

                return ApiResponse.<String>builder()
                        .code(1000)
                        .message("Payment successful for order: " + orderId)
                        .result("SUCCESS")
                        .build();
            } else {
                cancelAndRestoreStock(orderId, "MoMo payment failed: " + (message != null ? message : "Unknown error"));
                return ApiResponse.<String>builder()
                        .code(1002)
                        .message("Payment failed: " + (message != null ? message : "Unknown error"))
                        .result("FAILED")
                        .build();
            }
        } catch (Exception e) {
            log.error("MoMo payment callback processing failed for order: {}", orderId, e);
            cancelAndRestoreStock(orderId, "MoMo payment processing failed: " + e.getMessage());
            return ApiResponse.<String>builder()
                    .code(1002)
                    .message("Payment processing failed: " + e.getMessage())
                    .result("FAILED")
                    .build();
        }
    }

    private void decreaseStockForOrder(Order order) {

        log.debug("Payment confirmed for order {}. Stock already reserved during checkout.", order.getId());
    }

    private void cancelAndRestoreStock(String orderId, String cancelReason) {
        Order order = orderRepository.findByIdWithShippingAndGroups(orderId).orElse(null);
        if (order == null || order.getStatus() == OrderStatus.CANCELLED) return;

        for (OrderShopGroup group : order.getOrderShopGroups()) {
            if (group.getWarehouse() == null) {
                log.warn("OrderShopGroup {} has no warehouse, skipping stock release", group.getId());
                continue;
            }
            
            String warehouseId = group.getWarehouse().getId();
            for (OrderItem item : group.getOrderItems()) {
                if (item.getProductVariant() != null) {
                    String variantId = item.getProductVariant().getId();
                    Long quantity = (long) item.getQuantity();
                    
                    try {
                        warehouseStockService.releaseReservation(warehouseId, variantId, quantity);
                        log.info("Released reservation of {} units of variant {} from warehouse {} for cancelled order", 
                                quantity, variantId, warehouseId);
                    } catch (Exception e) {
                        log.error("Failed to release reservation for variant {} from warehouse {}: {}", 
                                variantId, warehouseId, e.getMessage());
                    }
                }
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelReason(cancelReason);
        orderRepository.save(order);
    }

    private boolean verifyMoMoSignature(Map<String, String> params) {
        String received = params.get("signature");
        if (received == null || received.isBlank()) return false;

        // MoMo IPN signature fields (alphabetical order, value from params)
        // accessKey is injected from config, not sent in callback params
        String rawSig = "accessKey=" + moMoConfig.getAccessKey() +
                "&amount=" + params.getOrDefault("amount", "") +
                "&extraData=" + params.getOrDefault("extraData", "") +
                "&message=" + params.getOrDefault("message", "") +
                "&orderId=" + params.getOrDefault("orderId", "") +
                "&orderInfo=" + params.getOrDefault("orderInfo", "") +
                "&orderType=" + params.getOrDefault("orderType", "") +
                "&partnerCode=" + params.getOrDefault("partnerCode", "") +
                "&payType=" + params.getOrDefault("payType", "") +
                "&requestId=" + params.getOrDefault("requestId", "") +
                "&responseTime=" + params.getOrDefault("responseTime", "") +
                "&resultCode=" + params.getOrDefault("resultCode", "") +
                "&transId=" + params.getOrDefault("transId", "");

        String expected = hmacSHA256(moMoConfig.getSecretKey(), rawSig);
        return expected.equalsIgnoreCase(received);
    }

    private String hmacSHA256(String key, String data) {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error creating HMAC SHA256", e);
        }
    }

    @Override
    public String getPaymentMethod() {
        return "MOMO";
    }
}
