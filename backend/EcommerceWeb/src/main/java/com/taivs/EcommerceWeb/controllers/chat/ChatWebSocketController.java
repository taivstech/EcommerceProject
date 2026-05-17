package com.taivs.EcommerceWeb.controllers.chat;

import com.taivs.EcommerceWeb.dto.request.chat.SendMessageRequest;
import com.taivs.EcommerceWeb.dto.response.chat.MessageResponse;
import com.taivs.EcommerceWeb.services.chat.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public MessageResponse send(@Valid SendMessageRequest request, Principal principal) {
        String senderId = principal != null ? principal.getName() : null;
        if (senderId == null) {
            throw new IllegalArgumentException("Unauthenticated");
        }
        return messageService.sendMessage(senderId, request);
    }

    @MessageMapping("/chat.typing")
    public void typing(@Payload Map<String, String> payload, Principal principal) {
        if (principal == null)
            return;
        String roomId = payload.get("roomId");
        if (roomId == null || roomId.isBlank())
            return;

        messagingTemplate.convertAndSend(
                "/topic/rooms/" + roomId + "/typing",
                Map.of("userId", principal.getName(), "typing", true));
    }
}
