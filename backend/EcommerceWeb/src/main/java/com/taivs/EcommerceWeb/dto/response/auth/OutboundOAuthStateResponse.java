package com.taivs.EcommerceWeb.dto.response.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboundOAuthStateResponse {
    private String state;

    @JsonProperty("state_signature")
    private String stateSignature;

    @JsonProperty("expires_in_seconds")
    private long expiresInSeconds;
}

