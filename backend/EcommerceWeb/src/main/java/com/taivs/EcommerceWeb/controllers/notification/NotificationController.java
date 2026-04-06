package com.taivs.EcommerceWeb.controllers.notification;

import com.taivs.EcommerceWeb.dto.response.notification.NotificationResponse;
import com.taivs.EcommerceWeb.services.notification.NotificationService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("hasAuthority('notification:read') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<List<NotificationResponse>> myNotifications() {
        return ApiResponse.<List<NotificationResponse>>builder()
                .result(notificationService.getMyNotifications())
                .build();
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAuthority('notification:read') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN') or hasRole('WAREHOUSE_EMPLOYEE')")
    public ApiResponse<Long> myUnreadCount() {
        return ApiResponse.<Long>builder()
                .result(notificationService.getMyUnreadCount())
                .build();
    }

    @GetMapping("/unread-order-count")
    @PreAuthorize("hasAuthority('notification:read') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN') or hasRole('WAREHOUSE_EMPLOYEE')")
    public ApiResponse<Long> myUnreadOrderCount() {
        return ApiResponse.<Long>builder()
                .result(notificationService.getMyUnreadOrderCount())
                .build();
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasAuthority('notification:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> markAsRead(@PathVariable("id") String id) {
        notificationService.markAsRead(id);
        return ApiResponse.<Void>builder().build();
    }

    @PutMapping("/read-all")
    @PreAuthorize("hasAuthority('notification:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return ApiResponse.<Void>builder().build();
    }
}

