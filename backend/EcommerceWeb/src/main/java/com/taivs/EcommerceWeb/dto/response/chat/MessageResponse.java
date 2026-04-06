package com.taivs.EcommerceWeb.dto.response.chat;

import com.taivs.EcommerceWeb.models.chat.MessageId;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MessageResponse {
    private String roomId;
    private String messageId;
    private LocalDateTime sentAt;
    private String senderId;
    private String senderName;
    private String content;
    private String type;
}

