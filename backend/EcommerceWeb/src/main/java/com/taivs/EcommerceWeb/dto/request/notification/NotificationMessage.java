package com.taivs.EcommerceWeb.dto.request.notification;

import lombok.*;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationMessage implements Serializable {
    private static final long serialVersionUID = 1L;

    private String userId;
    private String type;
    private String title;
    private String message;
    private String referenceId;
    private String referenceType;
    private java.util.Map<String, String> options;
}
