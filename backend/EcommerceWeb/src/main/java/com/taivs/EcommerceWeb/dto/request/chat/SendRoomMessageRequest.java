package com.taivs.EcommerceWeb.dto.request.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendRoomMessageRequest {
    @NotBlank
    @Size(max = 10000)
    private String content;

    @Size(max = 20)
    private String type = "TEXT";
}

