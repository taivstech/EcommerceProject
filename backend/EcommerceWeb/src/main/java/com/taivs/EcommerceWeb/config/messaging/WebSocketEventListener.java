package com.taivs.EcommerceWeb.config.messaging;

import com.taivs.EcommerceWeb.services.chat.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final PresenceService presenceService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        String userIdStr = extractUserId(sha);

        if (userIdStr != null) {
            try {
                UUID userId = UUID.fromString(userIdStr);
                presenceService.userConnected(userId);
                log.debug("WS connected: userId={}", userId);
            } catch (IllegalArgumentException e) {
                log.warn("WS connect: invalid userId format '{}'", userIdStr);
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        String userIdStr = extractUserId(sha);

        if (userIdStr != null) {
            try {
                UUID userId = UUID.fromString(userIdStr);
                presenceService.userDisconnected(userId);
                log.debug("WS disconnected: userId={}", userId);
            } catch (IllegalArgumentException e) {
                log.warn("WS disconnect: invalid userId format '{}'", userIdStr);
            }
        }
    }

    private String extractUserId(StompHeaderAccessor sha) {
        if (sha.getUser() != null) {
            return sha.getUser().getName();
        }
        if (sha.getSessionAttributes() != null) {
            Object attr = sha.getSessionAttributes().get("userId");
            if (attr != null) return attr.toString();
        }
        return null;
    }
}
