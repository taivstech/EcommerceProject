package com.taivs.EcommerceWeb.models.chat;

import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;

@Entity
@Table(name = "rooms",
        indexes = {
                @Index(name = "idx_rooms_type", columnList = "type"),
                @Index(name = "idx_rooms_last_message_at", columnList = "last_message_at"),
                @Index(name = "idx_rooms_type_last_message", columnList = "type, last_message_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room extends BaseEntity {
    @Id
    @Column(name = "room_id", length = 36)
    private String roomId;

    @Column(length = 200)
    private String name;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String type = "PRIVATE";

    @Column(name = "private_key", length = 100, unique = true)
    private String privateKey;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;
}

