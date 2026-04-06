package com.taivs.EcommerceWeb.dto.request.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExchangeTokenRequest {

    @NotBlank(message = "Authorization code is required")
    private String code;

    private String state;

    @JsonProperty("state_signature")
    private String stateSignature;

    @JsonProperty("code_verifier")
    private String codeVerifier;

    @JsonProperty("redirect_uri")
    private String redirectUri;
}
