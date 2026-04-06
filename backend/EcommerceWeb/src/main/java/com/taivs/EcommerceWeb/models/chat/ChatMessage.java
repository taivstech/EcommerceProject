package com.taivs.EcommerceWeb.models.chat;

import com.taivs.EcommerceWeb.models.user.User;
import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name = "messages",
        indexes = {
                @Index(name = "idx_sender", columnList = "sender"),
                @Index(name = "idx_sent_at", columnList = "sent_at"),
                @Index(name = "idx_room_sent", columnList = "room_id, sent_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @EmbeddedId
    private MessageId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", insertable = false, updatable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender")
    private User sender;

    @Column(name = "sendername", length = 100)
    private String senderName;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 20)
    private String type;
}

