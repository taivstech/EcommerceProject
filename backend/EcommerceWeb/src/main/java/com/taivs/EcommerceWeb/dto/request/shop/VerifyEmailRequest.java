package com.taivs.EcommerceWeb.dto.request.shop;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyEmailRequest {

    @NotBlank(message = "Session ID is required")
    @JsonProperty("sessionId")
    private String sessionId;

    @NotBlank(message = "OTP code is required")
    private String otp;
}
