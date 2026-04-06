package com.taivs.EcommerceWeb.dto.response.warehouse;

import com.taivs.EcommerceWeb.models.auth.Role;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WarehouseEmployeeResponse {
    String id;
    String userId;
    String username;
    String fullName;
    String email;
    String role;
}
