package com.taivs.EcommerceWeb.serviceimpl.order;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.services.notification.NotificationService;
import com.taivs.EcommerceWeb.services.order.OrderNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderNotificationServiceImpl implements OrderNotificationService {

    private final NotificationService notificationService;
    private final OrderRepository orderRepository;

    @Override
    @Transactional(readOnly = true)
    public void notifyOrderCreated(String orderId) {
        try {
            Order order = orderRepository.findByIdForNotification(orderId).orElse(null);
            if (order == null) {
                log.error("Order {} not found — skipping notification", orderId);
                return;
            }
            notifyNewOrder(order);
        } catch (Exception e) {
            log.error("Failed to send order-created notifications: orderId={}", orderId, e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void notifyOrderStatusChanged(String orderId, String buyerUserId,
                                         String oldStatus, String newStatus,
                                         String cancelReason) {
        try {
            notifyStatusChanged(orderId, buyerUserId, newStatus, cancelReason);
        } catch (Exception e) {
            log.error("Failed to send status-change notifications: orderId={}", orderId, e);
        }
    }

    private void notifyNewOrder(Order order) {
        if (order.getOrderShopGroups() == null || order.getOrderShopGroups().isEmpty()) {
            log.warn("Order {} has no OrderShopGroups — skipping", order.getId());
            return;
        }

        order.getOrderShopGroups().forEach(group -> {
            if (group.getShop() == null) return;

            try {
                notificationService.createAndPush(
                        group.getShop().getUser().getId(), "NEW_ORDER",
                        "Đơn hàng mới",
                        "Bạn có đơn hàng mới #" + shortId(order.getId()),
                        order.getId(), "ORDER");
            } catch (Exception e) {
                log.error("Failed to notify seller for order {}", order.getId(), e);
            }
        });
    }

    private void notifyStatusChanged(String orderId, String buyerId,
                                     String newStatus, String cancelReason) {
        String shortId = shortId(orderId);

        String title;
        String message;

        switch (newStatus) {
            case "CONFIRMED" -> {
                title   = "Đơn hàng đã xác nhận";
                message = "Đơn hàng #" + shortId + "... đã được người bán xác nhận và đang chuẩn bị hàng";
                notificationService.createAndPush(buyerId, "ORDER_STATUS", title, message, orderId, "ORDER");
                notifySellerForStatus(orderId, "ORDER_STATUS",
                        "Bạn đã xác nhận đơn hàng",
                        "Đơn hàng #" + shortId + "... đã được xác nhận. Vui lòng chuẩn bị hàng");
            }
            case "SHIPPING" -> {
                title   = "Đơn hàng đang giao";
                message = "Đơn hàng #" + shortId + "... đang được giao đến bạn";
                notificationService.createAndPush(buyerId, "ORDER_STATUS", title, message, orderId, "ORDER");
                notifySellerForStatus(orderId, "ORDER_STATUS",
                        "Đơn hàng đang được giao",
                        "Đơn hàng #" + shortId + "... đang trên đường giao đến khách hàng");
            }
            case "DELIVERED" -> {
                title   = "Đơn hàng đã giao";
                message = "Đơn hàng #" + shortId + "... đã được giao. Vui lòng xác nhận đã nhận hàng";
                notificationService.createAndPush(buyerId, "ORDER_STATUS", title, message, orderId, "ORDER");
                notifySellerForStatus(orderId, "ORDER_STATUS",
                        "Đơn hàng đã được giao",
                        "Đơn hàng #" + shortId + "... đã được giao cho khách hàng");
            }
            case "COMPLETED" -> {
                title   = "Đơn hàng hoàn thành";
                message = "Đơn hàng #" + shortId + "... đã hoàn thành. Cảm ơn bạn đã mua sắm!";
                notificationService.createAndPush(buyerId, "ORDER_STATUS", title, message, orderId, "ORDER");
                notifySellerForStatus(orderId, "ORDER_COMPLETED",
                        "Đơn hàng hoàn thành",
                        "Người mua đã xác nhận nhận đơn hàng #" + shortId + "...");
            }
            case "CANCELLED" -> {
                title   = "Đơn hàng đã hủy";
                message = "Đơn hàng #" + shortId + "... đã bị hủy"
                        + (cancelReason != null ? ". Lý do: " + cancelReason : "");
                notificationService.createAndPush(buyerId, "ORDER_STATUS", title, message, orderId, "ORDER");
                notifySellerForStatus(orderId, "ORDER_CANCELLED",
                        "Đơn hàng bị hủy",
                        "Đơn hàng #" + shortId + "... đã bị hủy");
            }
            default -> log.debug("No notification mapped for status: {}", newStatus);
        }
    }

    private void notifySellerForStatus(String orderId, String type, String title, String message) {
        orderRepository.findByIdForNotification(orderId).ifPresent(order ->
                order.getOrderShopGroups().forEach(group -> {
                    if (group.getShop() != null) {
                        try {
                            notificationService.createAndPush(
                                    group.getShop().getUser().getId(),
                                    type, title, message, orderId, "ORDER");
                        } catch (Exception e) {
                            log.error("Failed to notify seller for order {}", orderId, e);
                        }
                    }
                })
        );
    }

    private String shortId(String id) {
        return id != null && id.length() > 8 ? id.substring(0, 8) : id;
    }
}

