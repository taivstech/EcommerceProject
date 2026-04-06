package com.taivs.EcommerceWeb.dto.request.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePrivateChatRequest {
    @NotBlank
    private String otherUserId;
}

