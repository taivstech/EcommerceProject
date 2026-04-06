package com.taivs.EcommerceWeb.services.chat;

import com.taivs.EcommerceWeb.dto.request.chat.CreatePrivateChatRequest;
import com.taivs.EcommerceWeb.dto.request.chat.SendMessageRequest;
import com.taivs.EcommerceWeb.dto.response.chat.MessageResponse;
import com.taivs.EcommerceWeb.dto.response.chat.PrivateChatResponse;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;

public interface MessageService {

    PrivateChatResponse createOrGetPrivateChat(CreatePrivateChatRequest request);

    List<PrivateChatResponse> myPrivateChats();

    List<MessageResponse> getRoomMessages(String roomId);

    Page<MessageResponse> getRoomMessages(String roomId, int page, int size);

    MessageResponse sendMessage(String senderId, SendMessageRequest request);

    MessageResponse sendMyMessage(SendMessageRequest request);

    void markAsRead(String roomId);

    Map<String, Long> getUnreadCounts();
}
