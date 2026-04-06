package com.taivs.EcommerceWeb.dto.request.warehouse;

import com.taivs.EcommerceWeb.models.auth.Role;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignEmployeeRequest {
    @NotBlank(message = "Username or email is required")
    String usernameOrEmail;

    String role;
}
