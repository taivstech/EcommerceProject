package com.taivs.EcommerceWeb.config.scheduling;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import com.taivs.EcommerceWeb.models.order.OrderShopGroup;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.repositories.product.ProductVariantRepository;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseStockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderCancellationScheduler {

    private final OrderRepository orderRepository;
    private final ProductVariantRepository productVariantRepository;
    private final WarehouseStockService warehouseStockService;

    @org.springframework.beans.factory.annotation.Value("${order.payment-timeout-minutes:30}")
    private int paymentTimeoutMinutes;

    @org.springframework.beans.factory.annotation.Value("${order.auto-complete-days:7}")
    private int autoCompleteDays;

    @Scheduled(fixedRate = 300000)
    @Transactional
    public void cancelUnpaidOrders() {
        log.debug("Running scheduled job to cancel unpaid orders");

        LocalDateTime threshold = LocalDateTime.now().minusMinutes(paymentTimeoutMinutes);

        List<Order> unpaidOrders = orderRepository.findByStatusAndCreatedAtBefore(
                OrderStatus.AWAITING_PAYMENT, 
                threshold
        );

        if (unpaidOrders.isEmpty()) {
            log.debug("No unpaid orders to cancel");
            return;
        }

        log.info("Found {} unpaid orders to cancel", unpaidOrders.size());

        for (Order order : unpaidOrders) {
            try {
                cancelOrderAndRestoreStock(order);
                log.info("Cancelled unpaid order: {} (created at: {})", 
                        order.getId(), order.getCreatedAt());
            } catch (Exception e) {
                log.error("Failed to cancel order: {}", order.getId(), e);
            }
        }
    }

    private void cancelOrderAndRestoreStock(Order order) {
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
                        log.info("Released reservation: {} units of variant {} from warehouse {} (timeout cancel)",
                                quantity, variantId, warehouseId);
                    } catch (Exception e) {
                        log.error("Failed to release reservation for variant {} warehouse {}: {}", variantId, warehouseId, e.getMessage());
                    }
                }
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelReason("Tự động hủy do không thanh toán trong " + paymentTimeoutMinutes + " phút");
        orderRepository.save(order);
    }

    @Scheduled(fixedRate = 3_600_000) // 1 hour
    @Transactional
    public void autoCompleteDeliveredOrders() {
        log.debug("Running scheduled job to auto-complete long-delivered orders");

        LocalDateTime threshold = LocalDateTime.now().minusDays(autoCompleteDays);
        List<Order> deliveredOrders = orderRepository.findByStatusAndUpdatedAtBefore(
                OrderStatus.DELIVERED, threshold);

        if (deliveredOrders.isEmpty()) {
            log.debug("No delivered orders to auto-complete");
            return;
        }

        log.info("Auto-completing {} delivered orders (delivered > {} days ago)", deliveredOrders.size(), autoCompleteDays);
        for (Order order : deliveredOrders) {
            try {
                order.changeStatus(OrderStatus.COMPLETED);
                orderRepository.save(order);
                log.info("Auto-completed order: {} (last updated: {})", order.getId(), order.getUpdatedAt());
            } catch (Exception e) {
                log.error("Failed to auto-complete order: {}", order.getId(), e);
            }
        }
    }
}
