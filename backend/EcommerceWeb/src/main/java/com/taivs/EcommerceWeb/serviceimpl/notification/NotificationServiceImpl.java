package com.taivs.EcommerceWeb.serviceimpl.notification;

import com.taivs.EcommerceWeb.models.auth.Role;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.dto.response.notification.NotificationResponse;
import com.taivs.EcommerceWeb.models.notification.Notification;
import com.taivs.EcommerceWeb.repositories.notification.NotificationRepository;
import com.taivs.EcommerceWeb.services.notification.NotificationService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import com.taivs.EcommerceWeb.utils.AuthUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public List<NotificationResponse> getMyNotifications() {
        String userId = AuthUtils.currentUserId();
        return notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public long getMyUnreadCount() {
        String userId = AuthUtils.currentUserId();
        return notificationRepository.countUnreadByUserId(userId);
    }

    @Override
    public long getMyUnreadOrderCount() {
        String userId = AuthUtils.currentUserId();
        return notificationRepository.countUnreadOrderNotificationsByUserId(userId);
    }

    @Override
    @Transactional
    public void markAsRead(String id) {
        String userId = AuthUtils.currentUserId();
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));
        if (!n.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        if (!"READ".equalsIgnoreCase(n.getStatus())) {
            n.setStatus("READ");
            n.setReadAt(LocalDateTime.now());
            notificationRepository.save(n);
        }
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        String userId = AuthUtils.currentUserId();
        List<Notification> all = notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
        for (Notification n : all) {
            if ("UNREAD".equalsIgnoreCase(n.getStatus())) {
                n.setStatus("READ");
                n.setReadAt(LocalDateTime.now());
                notificationRepository.save(n);
            }
        }
    }

    @Override
    @Transactional
    public NotificationResponse createAndPush(String userId, String type, String title, String message) {
        return createAndPush(userId, type, title, message, null, null);
    }

    @Override
    @Transactional
    public NotificationResponse createAndPush(String userId, String type, String title, String message,
                                               String referenceId, String referenceType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Notification n = Notification.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .status("UNREAD")
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build();

        Notification saved = notificationRepository.save(n);
        NotificationResponse resp = toResponse(saved);

        try {
            messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", resp);
        } catch (Exception e) {
            log.warn("Could not push notification via WebSocket to user {}: {}", userId, e.getMessage());
        }
        return resp;
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userId(n.getUser() != null ? n.getUser().getId() : null)
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .status(n.getStatus())
                .createdAt(n.getCreatedAt())
                .readAt(n.getReadAt())
                .referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType())
                .build();
    }
}
