package com.taivs.EcommerceWeb.dto.response.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import com.taivs.EcommerceWeb.dto.response.auth.RoleResponse;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private String id;
    private String username;

    private String email;

    @JsonProperty("full_name")
    private String fullName;

    private LocalDate dob;

    @JsonProperty("profile_picture")
    private String profilePicture;

    private Set<RoleResponse> roles;
}
