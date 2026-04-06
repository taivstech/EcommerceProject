package com.taivs.EcommerceWeb.services.order;



public interface OrderNotificationService {

    void notifyOrderCreated(String orderId);

    void notifyOrderStatusChanged(String orderId, String buyerUserId,
                                  String oldStatus, String newStatus,
                                  String cancelReason);
}
