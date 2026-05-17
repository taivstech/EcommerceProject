package com.taivs.EcommerceWeb.serviceimpl.chat;

import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.dto.request.chat.CreatePrivateChatRequest;
import com.taivs.EcommerceWeb.dto.request.chat.SendMessageRequest;
import com.taivs.EcommerceWeb.dto.response.chat.MessageResponse;
import com.taivs.EcommerceWeb.dto.response.chat.PrivateChatResponse;
import com.taivs.EcommerceWeb.models.chat.ChatMessage;
import com.taivs.EcommerceWeb.models.chat.MessageId;
import com.taivs.EcommerceWeb.models.chat.Room;
import com.taivs.EcommerceWeb.models.chat.RoomMember;
import com.taivs.EcommerceWeb.models.chat.RoomMemberId;
import com.taivs.EcommerceWeb.repositories.chat.ChatMessageRepository;
import com.taivs.EcommerceWeb.repositories.chat.RoomRepository;
import com.taivs.EcommerceWeb.repositories.chat.RoomMemberRepository;
import com.taivs.EcommerceWeb.services.chat.MessageService;
import com.taivs.EcommerceWeb.services.notification.NotificationService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import com.taivs.EcommerceWeb.utils.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public PrivateChatResponse createOrGetPrivateChat(CreatePrivateChatRequest request) {
        String meId = AuthUtils.currentUserId();
        String otherId = request.getOtherUserId();

        if (otherId == null || otherId.isBlank() || meId.equals(otherId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        User other = userRepository.findById(otherId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        String privateKey = buildPrivateKey(meId, otherId);
        return roomRepository.findByPrivateKey(privateKey)
                .map(room -> PrivateChatResponse.builder()
                        .roomId(room.getRoomId())
                        .otherUserId(other.getId())
                        .otherUserName(displayName(other))
                        .createdAt(room.getCreatedAt())
                        .lastMessageAt(room.getLastMessageAt())
                        .build())
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    Room room = Room.builder()
                            .roomId(UUID.randomUUID().toString())
                            .type("PRIVATE")
                            .privateKey(privateKey)
                            .name(buildPrivateRoomName(meId, otherId))
                            .lastMessageAt(now)
                            .build();
                    roomRepository.save(room);

                    roomMemberRepository.save(RoomMember.builder()
                            .id(new RoomMemberId(room.getRoomId(), meId))
                            .room(room)
                            .user(userRepository.findById(meId)
                                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)))
                            .build());

                    roomMemberRepository.save(RoomMember.builder()
                            .id(new RoomMemberId(room.getRoomId(), otherId))
                            .room(room)
                            .user(other)
                            .build());

                    return PrivateChatResponse.builder()
                            .roomId(room.getRoomId())
                            .otherUserId(other.getId())
                            .otherUserName(displayName(other))
                            .createdAt(room.getCreatedAt())
                            .lastMessageAt(room.getLastMessageAt())
                            .build();
                });
    }

    @Override
    public List<PrivateChatResponse> myPrivateChats() {
        String meId = AuthUtils.currentUserId();
        return roomMemberRepository.findMyPrivateChats(meId);
    }

    @Override
    public List<MessageResponse> getRoomMessages(String roomId) {
        String meId = AuthUtils.currentUserId();
        ensureMember(roomId, meId);

        return chatMessageRepository.findAllByRoomIdAsc(roomId)
                .stream()
                .map(this::toMessageResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(String senderId, SendMessageRequest request) {
        if (request.getRoomId() == null || request.getRoomId().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));

        boolean isMember = roomMemberRepository.existsById(new RoomMemberId(room.getRoomId(), senderId));
        if (!isMember) {
            throw new AppException(ErrorCode.CHAT_NOT_ALLOWED);
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        LocalDateTime sentAt = LocalDateTime.now();
        MessageId id = new MessageId(room.getRoomId(), sentAt, UUID.randomUUID().toString());

        ChatMessage msg = ChatMessage.builder()
                .id(id)
                .room(room)
                .sender(sender)
                .senderName(displayName(sender))
                .content(request.getContent())
                .type(request.getType() == null || request.getType().isBlank() ? "TEXT" : request.getType())
                .build();

        chatMessageRepository.save(msg);
        room.setLastMessageAt(sentAt);
        roomRepository.save(room);

        MessageResponse resp = toMessageResponse(msg);

        messagingTemplate.convertAndSend("/topic/rooms/" + room.getRoomId(), resp);

        if ("PRIVATE".equalsIgnoreCase(room.getType())) {
            String recipientId = roomMemberRepository.findOtherMemberId(room.getRoomId(), senderId)
                    .orElse(null);
            if (recipientId != null) {
                notificationService.createAndPush(
                        recipientId,
                        "NEW_MESSAGE",
                        "New message",
                        "You have a new message from " + displayName(sender)
                );
            }
        }

        return resp;
    }

    @Override
    @Transactional
    public MessageResponse sendMyMessage(SendMessageRequest request) {
        String meId = AuthUtils.currentUserId();
        return sendMessage(meId, request);
    }

    @Override
    public Page<MessageResponse> getRoomMessages(String roomId, int page, int size) {
        String meId = AuthUtils.currentUserId();
        ensureMember(roomId, meId);
        return chatMessageRepository.findByRoomIdPaged(roomId, PageRequest.of(page, size))
                .map(this::toMessageResponse);
    }

    @Override
    @Transactional
    public void markAsRead(String roomId) {
        String meId = AuthUtils.currentUserId();
        ensureMember(roomId, meId);
        roomMemberRepository.updateLastReadAt(roomId, meId, LocalDateTime.now());
    }

    @Override
    public Map<String, Long> getUnreadCounts() {
        String meId = AuthUtils.currentUserId();
        List<RoomMember> memberships = roomMemberRepository.findAllByUserId(meId);
        Map<String, Long> counts = new HashMap<>();
        for (RoomMember rm : memberships) {
            String roomId = rm.getId().getRoomId();
            LocalDateTime lastRead = rm.getLastReadAt();
            long unread;
            if (lastRead == null) {
                // Never read → count all messages in this room
                unread = chatMessageRepository.findAllByRoomIdAsc(roomId).size();
            } else {
                unread = chatMessageRepository.countByRoomIdAfter(roomId, lastRead);
            }
            if (unread > 0) {
                counts.put(roomId, unread);
            }
        }
        return counts;
    }

    private void ensureMember(String roomId, String userId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));
        boolean ok = roomMemberRepository.existsById(new RoomMemberId(room.getRoomId(), userId));
        if (!ok) {
            throw new AppException(ErrorCode.CHAT_NOT_ALLOWED);
        }
    }

    private String buildPrivateKey(String a, String b) {
        return a.compareTo(b) < 0 ? (a + ":" + b) : (b + ":" + a);
    }

    private String buildPrivateRoomName(String a, String b) {
        return "Private: " + buildPrivateKey(a, b);
    }

    private String displayName(User user) {
        if (user.getFullName() != null && !user.getFullName().isBlank()) return user.getFullName();
        return user.getUsername();
    }

    private MessageResponse toMessageResponse(ChatMessage msg) {
        return MessageResponse.builder()
                .roomId(msg.getId().getRoomId())
                .messageId(msg.getId().getMessageId())
                .sentAt(msg.getId().getSentAt())
                .senderId(msg.getSender() != null ? msg.getSender().getId() : null)
                .senderName(msg.getSenderName())
                .content(msg.getContent())
                .type(msg.getType())
                .build();
    }
}
