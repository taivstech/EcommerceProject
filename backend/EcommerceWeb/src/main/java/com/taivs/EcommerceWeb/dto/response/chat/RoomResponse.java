package com.taivs.EcommerceWeb.dto.response.chat;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RoomResponse {
    private String roomId;
    private String name;
    private LocalDateTime createdAt;
    private LocalDateTime lastMessageAt;
}

