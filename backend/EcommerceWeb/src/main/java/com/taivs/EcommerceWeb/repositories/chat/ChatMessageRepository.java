package com.taivs.EcommerceWeb.repositories.chat;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.chat.ChatMessage;
import com.taivs.EcommerceWeb.models.chat.MessageId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, MessageId> {

    @Query("""
            select m
            from ChatMessage m
            where m.id.roomId = :roomId
            order by m.id.sentAt asc
            """)
    List<ChatMessage> findAllByRoomIdAsc(@Param("roomId") String roomId);

    @Query("""
            select m
            from ChatMessage m
            where m.id.roomId = :roomId
            order by m.id.sentAt desc
            """)
    List<ChatMessage> findAllByRoomIdDesc(@Param("roomId") String roomId);

    @Query("""
            select m
            from ChatMessage m
            where m.id.roomId = :roomId
            order by m.id.sentAt desc
            """)
    Page<ChatMessage> findByRoomIdPaged(@Param("roomId") String roomId, Pageable pageable);

    @Query("""
            select count(m)
            from ChatMessage m
            where m.id.roomId = :roomId
              and m.id.sentAt > :since
            """)
    long countByRoomIdAfter(@Param("roomId") String roomId, @Param("since") LocalDateTime since);
}

