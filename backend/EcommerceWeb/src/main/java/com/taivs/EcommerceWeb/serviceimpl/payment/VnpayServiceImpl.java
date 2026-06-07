package com.taivs.EcommerceWeb.serviceimpl.payment;

import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.config.integration.VnpayConfig;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import com.taivs.EcommerceWeb.models.order.OrderShopGroup;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.services.payment.PaymentGateway;
import com.taivs.EcommerceWeb.services.payment.VnpayService;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.repositories.product.ProductVariantRepository;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseStockService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.Calendar;
import java.util.TimeZone;

@Service
@RequiredArgsConstructor
@Slf4j
public class VnpayServiceImpl implements VnpayService, PaymentGateway {
    private final VnpayConfig vnpayConfig;
    private final OrderRepository orderRepository;
    private final ProductVariantRepository productVariantRepository;
    private final WarehouseStockService warehouseStockService;

    @Override
    public String createPaymentUrl(String orderId, BigDecimal amount, String orderInfo, String clientIp) {
        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String vnp_TmnCode = vnpayConfig.getTmnCode();
        String vnp_Amount = String.valueOf(amount.multiply(new BigDecimal("100")).longValue());
        String vnp_CurrCode = "VND";
        String vnp_TxnRef = orderId;
        String vnp_OrderInfo = orderInfo != null && !orderInfo.isEmpty() ? orderInfo : "Thanh toan don hang:" + orderId;
        String vnp_OrderType = "other";
        String vnp_Locale = "vn";
        String vnp_ReturnUrl = vnpayConfig.getReturnUrl();
        

        String vnp_IpAddr = clientIp;
        if (clientIp == null || clientIp.isEmpty() || 
            clientIp.equals("0:0:0:0:0:0:0:1") || 
            clientIp.equals("127.0.0.1") || 
            clientIp.equals("localhost")) {

            vnp_IpAddr = "127.0.0.1";
        }


        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyyMMddHHmmss");
        dateFormat.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        String vnp_CreateDate = dateFormat.format(calendar.getTime());
        

        calendar.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = dateFormat.format(calendar.getTime());

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", vnp_Amount);
        vnp_Params.put("vnp_CurrCode", vnp_CurrCode);
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
        vnp_Params.put("vnp_OrderType", vnp_OrderType);
        vnp_Params.put("vnp_Locale", vnp_Locale);
        vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        List<String> validFields = new ArrayList<>();
        for (String fieldName : fieldNames) {
            String fieldValue = vnp_Params.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                validFields.add(fieldName);
            }
        }
        

        for (Iterator<String> iterator = validFields.iterator(); iterator.hasNext();) {
            String fieldName = iterator.next();
            String fieldValue = vnp_Params.get(fieldName);
            
            hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
            query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8))
                    .append('=')
                    .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
            if (iterator.hasNext()) {
                hashData.append('&');
                query.append('&');
            }
        }
        
        String vnp_SecureHash = hmacSHA512(vnpayConfig.getHashSecret(), hashData.toString());
        query.append("&vnp_SecureHash=").append(vnp_SecureHash);

        String finalUrl = vnpayConfig.getPaymentUrl() + "?" + query.toString();

        log.info("VNPay payment URL created successfully for orderId: {}, amount: {} VND", orderId, vnp_Amount);
        log.debug("VNPay returnUrl (without extra params): {}", vnp_ReturnUrl);
        log.debug("VNPay will redirect back with all transaction params including vnp_TxnRef (orderId)");
        
        return finalUrl;
    }

    @Override
    @Transactional
    public ApiResponse<String> vnpayCallback(Map<String, String> params) {
        try {
            log.info("VNPay callback received with params: {}", params.keySet());

            String vnp_SecureHash = params.get("vnp_SecureHash");
            if (vnp_SecureHash == null || vnp_SecureHash.isEmpty()) {
                log.error("VNPay callback missing vnp_SecureHash");
                return ApiResponse.<String>builder()
                        .code(400)
                        .message("Missing secure hash")
                        .result("FAILED")
                        .build();
            }

            params.remove("gateway");
            params.remove("orderId");

            params.remove("vnp_SecureHash");
            params.remove("vnp_SecureHashType");

            List<String> fieldNames = new ArrayList<>(params.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            for (int i = 0; i < fieldNames.size(); i++) {
                String fieldName = fieldNames.get(i);
                String fieldValue = params.get(fieldName);
                if (fieldValue != null && !fieldValue.isEmpty()) {
                    hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                    if (i < fieldNames.size() - 1) hashData.append('&');
                }
            }

            String checkSum = hmacSHA512(vnpayConfig.getHashSecret(), hashData.toString());
            String orderId = params.get("vnp_TxnRef");
            String responseCode = params.get("vnp_ResponseCode");
            
            boolean checksumMatch = checkSum.equalsIgnoreCase(vnp_SecureHash);
            log.info("VNPay callback - orderId: {}, responseCode: {}, checksum match: {}", 
                    orderId, responseCode, checksumMatch);
            
            if (!checksumMatch) {
                log.warn("VNPay checksum mismatch - hashData: {}, calculated: {}, received: {}", 
                        hashData.toString(), checkSum, vnp_SecureHash);
            }

            if (checkSum.equalsIgnoreCase(vnp_SecureHash)) {
                if ("00".equals(responseCode)) {

                    if (orderId == null || orderId.isEmpty()) {
                        log.error("VNPay callback missing orderId (vnp_TxnRef)");
                        return ApiResponse.<String>builder()
                                .code(400)
                                .message("Missing order ID")
                                .result("FAILED")
                                .build();
                    }
                    
                    // Lock order to prevent concurrent callback processing
                    Order order = orderRepository.findByIdForUpdate(orderId).orElseThrow(
                            () -> {
                                log.error("VNPay callback - order not found: {}", orderId);
                                return new AppException(ErrorCode.ORDER_NOT_EXISTS);
                            }
                    );

                    // Idempotency: VNPay may send duplicate callbacks
                    if (Boolean.TRUE.equals(order.getIsPaid())) {
                        log.info("VNPay duplicate callback ignored — order {} already paid", orderId);
                        return ApiResponse.<String>builder()
                                .code(1000)
                                .message("Payment already processed for order: " + orderId)
                                .result("SUCCESS")
                                .build();
                    }

                    // Validate amount: VNPay sends amount in cents (x100)
                    String vnpAmountStr = params.get("vnp_Amount");
                    if (vnpAmountStr != null) {
                        long receivedAmountCents = Long.parseLong(vnpAmountStr);
                        long expectedAmountCents = order.getTotal().multiply(new BigDecimal("100")).longValue();
                        if (receivedAmountCents != expectedAmountCents) {
                            log.error("VNPay amount mismatch for order {} - expected: {}, received: {}", orderId, expectedAmountCents, receivedAmountCents);
                            cancelAndRestoreStock(orderId, "Payment amount mismatch");
                            return ApiResponse.<String>builder()
                                    .code(400)
                                    .message("Payment amount mismatch")
                                    .result("FAILED")
                                    .build();
                        }
                    }

                    decreaseStockForOrder(order);
                    
                    order.changeStatus(OrderStatus.PENDING);
                    order.setIsPaid(true);
                    orderRepository.save(order);
                    
                    log.info("VNPay payment successful - order {} status updated to PENDING, isPaid=true, stock deducted", orderId);

                    return ApiResponse.<String>builder()
                            .code(1000)
                            .message("Payment successful for order: " + orderId)
                            .result("SUCCESS")
                            .build();
                } else {

                    log.warn("VNPay payment failed for order {} - responseCode: {}", orderId, responseCode);
                    if (orderId != null && !orderId.isEmpty()) {
                        cancelAndRestoreStock(orderId, "VNPay payment failed, error code: " + responseCode);
                    }
                    return ApiResponse.<String>builder()
                            .code(1002)
                            .message("Payment failed, error code: " + responseCode)
                            .result("FAILED")
                            .build();
                }
            } else {
                log.error("VNPay callback checksum mismatch - orderId: {}, expected: {}, received: {}", 
                        orderId, checkSum, vnp_SecureHash);
                if (orderId != null && !orderId.isEmpty()) {
                    cancelAndRestoreStock(orderId, "Payment verification failed (invalid checksum)");
                }
                return ApiResponse.<String>builder()
                        .code(400)
                        .message("Invalid checksum!")
                        .result("FAILED")
                        .build();
            }
        } catch (AppException e) {
            log.error("VNPay callback AppException: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("VNPay callback error: {}", e.getMessage(), e);
            return ApiResponse.<String>builder()
                    .code(500)
                    .message("Payment processing error: " + e.getMessage())
                    .result("FAILED")
                    .build();
        }
    }

    @Override
    public ApiResponse<String> handleCallback(Map<String, String> params) {
        return vnpayCallback(params);
    }

    @Override
    public String getPaymentMethod() {
        return "VNPAY";
    }

    private void decreaseStockForOrder(Order order) {
        log.debug("Payment confirmed for order {}. Stock already reserved during checkout.", order.getId());
    }

    private void cancelAndRestoreStock(String orderId, String cancelReason) {
        Order order = orderRepository.findByIdForUpdate(orderId).orElse(null);
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

    private String hmacSHA512(String key, String data) {
        try {
            Mac sha512_HMAC = Mac.getInstance("HmacSHA512");
            SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            sha512_HMAC.init(secret_key);
            byte[] hash = sha512_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error creating HMAC SHA512", e);
        }
    }
}
