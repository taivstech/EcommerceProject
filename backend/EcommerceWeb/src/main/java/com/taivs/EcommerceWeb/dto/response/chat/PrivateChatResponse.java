package com.taivs.EcommerceWeb.dto.response.chat;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrivateChatResponse {
    private String roomId;
    private String otherUserId;
    private String otherUserName;
    private String otherShopName;
    private LocalDateTime createdAt;
    private LocalDateTime lastMessageAt;
}

