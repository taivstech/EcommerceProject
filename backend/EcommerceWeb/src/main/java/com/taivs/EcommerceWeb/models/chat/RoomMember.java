package com.taivs.EcommerceWeb.models.chat;

import com.taivs.EcommerceWeb.models.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Join table between Room and User.
 * Composite key: (roomId, userId) - one user per room
 */
@Entity
@Table(
        name = "room_members",
        indexes = {
                @Index(name = "idx_room_members_user", columnList = "user_id"),
                @Index(name = "idx_room_members_room", columnList = "room_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomMember {

    @EmbeddedId
    private RoomMemberId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("roomId")
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;
}

