package com.taivs.EcommerceWeb.models.chat;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class MessageId implements Serializable {
    @Column(name = "room_id", length = 36)
    private String roomId;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "message_id", length = 36)
    private String messageId;
}

