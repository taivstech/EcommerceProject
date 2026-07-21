package com.taivs.EcommerceWeb.services.notification;

import com.taivs.EcommerceWeb.models.notification.Notification;
import com.taivs.EcommerceWeb.dto.response.notification.NotificationResponse;

import java.util.List;

public interface NotificationService {

    List<NotificationResponse> getMyNotifications();

    long getMyUnreadCount();

    long getMyUnreadOrderCount();

    void markAsRead(String id);

    void markAllAsRead();

    NotificationResponse createAndPush(String userId, String type, String title, String message);

    NotificationResponse createAndPush(String userId, String type, String title, String message,
                                        String referenceId, String referenceType);

    NotificationResponse createAndPush(String userId, String type, java.util.Map<String, String> options,
                                        String referenceId, String referenceType);
}
