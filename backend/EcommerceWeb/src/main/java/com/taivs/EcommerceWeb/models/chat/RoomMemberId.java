package com.taivs.EcommerceWeb.models.chat;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class RoomMemberId implements Serializable {

    @Column(name = "room_id", length = 36)
    private String roomId;

    @Column(name = "user_id", length = 36)
    private String userId;
}

