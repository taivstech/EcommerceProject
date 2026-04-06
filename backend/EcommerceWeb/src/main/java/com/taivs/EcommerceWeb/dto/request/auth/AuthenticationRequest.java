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
public class AuthenticationRequest {
    @NotBlank(message = "Email or phone is required")
    @JsonProperty("email_or_phone")
    private String emailOrPhone;

    @NotBlank(message = "Password is required")
    private String password;
}
