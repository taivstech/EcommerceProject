package com.taivs.EcommerceWeb.controllers.chat;

import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.dto.request.chat.CreatePrivateChatRequest;
import com.taivs.EcommerceWeb.dto.request.chat.SendMessageRequest;
import com.taivs.EcommerceWeb.dto.request.chat.SendRoomMessageRequest;
import com.taivs.EcommerceWeb.dto.response.chat.MessageResponse;
import com.taivs.EcommerceWeb.dto.response.chat.PrivateChatResponse;
import com.taivs.EcommerceWeb.services.chat.MessageService;
import com.taivs.EcommerceWeb.services.media.FileStorageService;
import com.taivs.EcommerceWeb.services.chat.PresenceService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final FileStorageService fileStorageService;
    private final PresenceService presenceService;

    @PostMapping("/private-chats")
    @PreAuthorize("hasAuthority('message:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<PrivateChatResponse> createOrGet(@RequestBody @Valid CreatePrivateChatRequest request) {
        return ApiResponse.<PrivateChatResponse>builder()
                .result(messageService.createOrGetPrivateChat(request))
                .build();
    }

    @GetMapping("/private-chats")
    @PreAuthorize("hasAuthority('message:read') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<List<PrivateChatResponse>> myChats() {
        return ApiResponse.<List<PrivateChatResponse>>builder()
                .result(messageService.myPrivateChats())
                .build();
    }

    @GetMapping("/rooms/{roomId}/messages")
    @PreAuthorize("hasAuthority('message:read') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<List<MessageResponse>> history(@PathVariable("roomId") String roomId) {
        return ApiResponse.<List<MessageResponse>>builder()
                .result(messageService.getRoomMessages(roomId))
                .build();
    }

    @GetMapping("/rooms/{roomId}/messages/paged")
    @PreAuthorize("hasAuthority('message:read') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Page<MessageResponse>> pagedHistory(
            @PathVariable("roomId") String roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.<Page<MessageResponse>>builder()
                .result(messageService.getRoomMessages(roomId, page, size))
                .build();
    }

    @PostMapping("/rooms/{roomId}/read")
    @PreAuthorize("hasAuthority('message:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> markAsRead(@PathVariable("roomId") String roomId) {
        messageService.markAsRead(roomId);
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/unread-counts")
    @PreAuthorize("hasAuthority('message:read') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Map<String, Long>> unreadCounts() {
        return ApiResponse.<Map<String, Long>>builder()
                .result(messageService.getUnreadCounts())
                .build();
    }

    @PostMapping(value = "/rooms/{roomId}/messages", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('message:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<MessageResponse> send(@PathVariable("roomId") String roomId,
                                             @RequestBody @Valid SendRoomMessageRequest request) {
        SendMessageRequest send = new SendMessageRequest();
        send.setRoomId(roomId);
        send.setContent(request.getContent());
        send.setType(request.getType());

        return ApiResponse.<MessageResponse>builder()
                .result(messageService.sendMyMessage(send))
                .build();
    }

    @PostMapping(value = "/rooms/{roomId}/messages", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('message:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<MessageResponse> sendImage(
            @PathVariable("roomId") String roomId,
            @RequestPart("file") MultipartFile file) {

        String imageUrl = fileStorageService.uploadAndGetUrl(file, "/chat");

        SendMessageRequest send = new SendMessageRequest();
        send.setRoomId(roomId);
        send.setContent(imageUrl);
        send.setType("IMAGE");

        return ApiResponse.<MessageResponse>builder()
                .result(messageService.sendMyMessage(send))
                .build();
    }

    @GetMapping("/users/{userId}/online")
    @PreAuthorize("hasAuthority('message:read') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Boolean> isOnline(@PathVariable("userId") String userId) {
        return ApiResponse.<Boolean>builder()
                .result(presenceService.isOnline(UUID.fromString(userId)))
                .build();
    }
}
