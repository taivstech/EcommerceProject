package com.taivs.EcommerceWeb.dto.request.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.taivs.EcommerceWeb.utils.DobConstraint;
import com.taivs.EcommerceWeb.utils.PasswordConstraint;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCreationRequest {
    @Size(min = 4, message = "USERNAME_INVALID")
    private String username;

    @PasswordConstraint
    private String password;

    @JsonProperty("confirm_password")
    @PasswordConstraint
    private String confirmPassword;

    @JsonProperty("full_name")
    private String fullName;
    private String email;
    private String phone;

    @DobConstraint(min = 10, message = "INVALID_DOB")
    LocalDate dob;
}
