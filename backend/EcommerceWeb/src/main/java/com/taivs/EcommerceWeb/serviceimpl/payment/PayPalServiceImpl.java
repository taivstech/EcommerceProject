package com.taivs.EcommerceWeb.serviceimpl.payment;

import com.paypal.sdk.PaypalServerSdkClient;
import com.paypal.sdk.models.AmountWithBreakdown;
import com.paypal.sdk.models.CaptureOrderInput;
import com.paypal.sdk.models.CheckoutPaymentIntent;
import com.paypal.sdk.models.CreateOrderInput;
import com.paypal.sdk.models.LinkDescription;
import com.paypal.sdk.models.OrderApplicationContext;
import com.paypal.sdk.models.OrderRequest;
import com.paypal.sdk.models.PurchaseUnitRequest;
import com.taivs.EcommerceWeb.config.integration.PayPalConfig;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import com.taivs.EcommerceWeb.models.order.OrderShopGroup;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.services.payment.PaymentGateway;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseStockService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayPalServiceImpl implements PaymentGateway {
    private final PayPalConfig payPalConfig;
    private final PaypalServerSdkClient paypalClient;
    private final OrderRepository orderRepository;
    private final WarehouseStockService warehouseStockService;

    @Override
    public String createPaymentUrl(String orderId, BigDecimal amount, String orderInfo, String clientIp) {
        try {
            String returnUrl = payPalConfig.getReturnUrl() + "?orderId=" + orderId + "&gateway=paypal";
            String cancelUrl = payPalConfig.getCancelUrl() + "?orderId=" + orderId;
            BigDecimal exchangeRate = BigDecimal.valueOf(payPalConfig.getExchangeRate());
            BigDecimal amountInUsd = amount.divide(exchangeRate, 2, RoundingMode.HALF_UP);
            String amountValue = amountInUsd.toPlainString();
            
            log.info("Creating PayPal payment for order {}: {} VND -> {} USD (Rate: {})", 
                    orderId, amount, amountValue, exchangeRate);

            var orderRequest = new OrderRequest.Builder(
                    CheckoutPaymentIntent.CAPTURE,
                    Arrays.asList(
                            new PurchaseUnitRequest.Builder(
                                    new AmountWithBreakdown.Builder("USD", amountValue).build()
                            )
                            .referenceId(orderId)
                            .description(orderInfo)
                            .build()
                    )
            )
            .applicationContext(
                    new OrderApplicationContext.Builder()
                            .returnUrl(returnUrl)
                            .cancelUrl(cancelUrl)
                            .build()
            )
            .build();

            var input = new CreateOrderInput.Builder(null, orderRequest).build();
            var paypalOrder = paypalClient.getOrdersController().createOrderAsync(input).get().getResult();

            return paypalOrder.getLinks().stream()
                    .filter(link -> "approve".equals(link.getRel()))
                    .findFirst()
                    .map(LinkDescription::getHref)
                    .orElseThrow(() -> new RuntimeException("No PayPal approval URL in response"));
        } catch (Exception e) {
            log.error("Failed to create PayPal payment URL for order: {}", orderId, e);
            throw new AppException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
    }

    @Override
    @Transactional
    public ApiResponse<String> handleCallback(Map<String, String> params) {
        String orderId = params.get("orderId");
        String token   = params.get("token"); // PayPal order token returned in redirect

        if (orderId == null || token == null) {
            return ApiResponse.<String>builder()
                    .code(400)
                    .message("Missing required parameters")
                    .result("FAILED")
                    .build();
        }

        try {
            var captureInput = new CaptureOrderInput.Builder(token, null).build();
            paypalClient.getOrdersController().captureOrderAsync(captureInput).get();

            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTS));
            order.changeStatus(OrderStatus.PENDING);
            order.setIsPaid(true);
            orderRepository.save(order);

            return ApiResponse.<String>builder()
                    .code(1000)
                    .message("Payment successful for order: " + orderId)
                    .result("SUCCESS")
                    .build();
        } catch (Exception e) {
            log.error("PayPal payment failed for order: {}", orderId, e);
            cancelAndRestoreStock(orderId, "PayPal payment failed: " + e.getMessage());
            return ApiResponse.<String>builder()
                    .code(1002)
                    .message("Payment failed: " + e.getMessage())
                    .result("FAILED")
                    .build();
        }
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
                        log.info("Released reservation: {} units of variant {} from warehouse {} (cancelled order)",
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

    @Override
    public String getPaymentMethod() {
        return "PAYPAL";
    }
}
