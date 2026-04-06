package com.taivs.EcommerceWeb.dto.request.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.taivs.EcommerceWeb.utils.DobConstraint;
import com.taivs.EcommerceWeb.utils.PasswordConstraint;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    @JsonProperty("old_password")
    String oldPassword;

    @PasswordConstraint(message = "Invalid password")
    String password;

    @JsonProperty("repeat_password")
    String repeatPassword;

    @JsonProperty("full_name")
    String fullName;

    String email;
    String phone;

    @DobConstraint(min = 18, message = "INVALID_DOB")
    LocalDate dob;

    List<String> roles;
}
