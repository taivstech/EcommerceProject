package com.taivs.EcommerceWeb.consumers;

import com.taivs.EcommerceWeb.config.RabbitMQConfig;
import com.taivs.EcommerceWeb.dto.request.notification.NotificationMessage;
import com.taivs.EcommerceWeb.models.notification.Notification;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.repositories.notification.NotificationRepository;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.dto.response.notification.NotificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    @Transactional
    public void consumeNotification(NotificationMessage msg) {
        log.info("Received notification message from RabbitMQ: user={}, type={}", msg.getUserId(), msg.getType());
        try {
            User user = userRepository.findById(msg.getUserId()).orElse(null);
            if (user == null) {
                log.error("User {} not found for notification. Skipping.", msg.getUserId());
                return;
            }

            Notification n = Notification.builder()
                    .id(UUID.randomUUID().toString())
                    .user(user)
                    .type(msg.getType())
                    .title(msg.getTitle())
                    .message(msg.getMessage())
                    .status("UNREAD")
                    .referenceId(msg.getReferenceId())
                    .referenceType(msg.getReferenceType())
                    .build();

            Notification saved = notificationRepository.save(n);
            NotificationResponse resp = NotificationResponse.builder()
                    .id(saved.getId())
                    .userId(saved.getUser().getId())
                    .type(saved.getType())
                    .title(saved.getTitle())
                    .message(saved.getMessage())
                    .status(saved.getStatus())
                    .createdAt(saved.getCreatedAt())
                    .readAt(saved.getReadAt())
                    .referenceId(saved.getReferenceId())
                    .referenceType(saved.getReferenceType())
                    .build();

            // Push via WebSocket
            messagingTemplate.convertAndSendToUser(msg.getUserId(), "/queue/notifications", resp);
            log.info("Successfully processed and sent notification ID: {} via WebSocket", saved.getId());
        } catch (Exception e) {
            log.error("Error processing notification from RabbitMQ: {}", e.getMessage(), e);
        }
    }
}
