package com.taivs.EcommerceWeb.serviceimpl.order;

import com.taivs.EcommerceWeb.services.notification.NotificationService;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.models.shop.Shop;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderNotificationService {

    private final NotificationService notificationService;

    @Async
    public void notifyNewOrder(Order order) {
        try {
            order.getOrderShopGroups().forEach(group -> {
                if (group.getShop() != null) {
                    Shop shop = group.getShop();
                    String sellerId = shop.getUser().getId();

                    notificationService.createAndPush(
                            sellerId,
                            "NEW_ORDER",
                            "Don hang moi",
                            "Ban co don hang moi #" + order.getId().substring(0, 8) + "...",
                            order.getId(),
                            "ORDER"
                    );
                }
            });
        } catch (Exception e) {
            log.error("Failed to send new order notifications: {}", e.getMessage());
        }
    }

    @Async
    public void notifyOrderStatusChanged(Order order, OrderStatus oldStatus, OrderStatus newStatus) {
        try {
            String buyerId = order.getUser().getId();
            String shortId = order.getId().substring(0, 8);

            String title;
            String message;

            switch (newStatus) {
                case CONFIRMED -> {
                    title = "Don hang da xac nhan";
                    message = "Don hang #" + shortId + "... da duoc nguoi ban xac nhan va dang chuan bi hang";
                }
                case SHIPPING -> {
                    title = "Don hang dang giao";
                    message = "Don hang #" + shortId + "... dang duoc giao den ban";
                }
                case DELIVERED -> {
                    title = "Don hang da giao";
                    message = "Don hang #" + shortId + "... da duoc giao. Vui long xac nhan da nhan hang";
                }
                case COMPLETED -> {
                    title = "Don hang hoan thanh";
                    message = "Don hang #" + shortId + "... da hoan thanh. Cam on ban da mua sam!";
                    // Also notify seller
                    notifySellerOrderCompleted(order);
                }
                case CANCELLED -> {
                    title = "Don hang da huy";
                    message = "Don hang #" + shortId + "... da bi huy"
                            + (order.getCancelReason() != null ? ". Ly do: " + order.getCancelReason() : "");
                    // Also notify seller about cancellation
                    notifySellerOrderCancelled(order);
                }
                default -> {
                    return;
                }
            }

            notificationService.createAndPush(buyerId, "ORDER_STATUS", title, message, order.getId(), "ORDER");

        } catch (Exception e) {
            log.error("Failed to send order status notification: {}", e.getMessage());
        }
    }

    private void notifySellerOrderCompleted(Order order) {
        order.getOrderShopGroups().forEach(group -> {
            if (group.getShop() != null) {
                String sellerId = group.getShop().getUser().getId();
                notificationService.createAndPush(
                        sellerId, "ORDER_COMPLETED",
                        "Don hang hoan thanh",
                        "Nguoi mua da xac nhan nhan don hang #" + order.getId().substring(0, 8) + "...",
                        order.getId(), "ORDER"
                );
            }
        });
    }

    private void notifySellerOrderCancelled(Order order) {
        order.getOrderShopGroups().forEach(group -> {
            if (group.getShop() != null) {
                String sellerId = group.getShop().getUser().getId();
                notificationService.createAndPush(
                        sellerId, "ORDER_CANCELLED",
                        "Don hang bi huy",
                        "Don hang #" + order.getId().substring(0, 8) + "... da bi huy",
                        order.getId(), "ORDER"
                );
            }
        });
    }
}

