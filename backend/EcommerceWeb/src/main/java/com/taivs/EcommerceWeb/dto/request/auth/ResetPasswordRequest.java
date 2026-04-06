package com.taivs.EcommerceWeb.dto.request.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.taivs.EcommerceWeb.utils.PasswordConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetPasswordRequest {

    @NotBlank(message = "TOKEN_REQUIRED")
    private String token;

    @JsonProperty("new_password")
    @PasswordConstraint
    private String newPassword;

    @JsonProperty("confirm_password")
    @PasswordConstraint
    private String confirmPassword;
}

