package com.taivs.EcommerceWeb.dto.request.shop;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyPhoneRequest {

    @NotBlank(message = "Session ID is required")
    @JsonProperty("sessionId")
    private String sessionId;

    @NotBlank(message = "Firebase ID Token is required")
    @JsonProperty("firebaseIdToken")
    private String firebaseIdToken;
}
