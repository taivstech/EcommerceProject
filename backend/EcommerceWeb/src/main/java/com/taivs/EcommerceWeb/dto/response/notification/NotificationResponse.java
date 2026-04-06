package com.taivs.EcommerceWeb.dto.response.notification;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationResponse {
    private String id;
    private String userId;
    private String type;
    private String title;
    private String message;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    private String referenceId;
    private String referenceType;
}

