package com.taivs.EcommerceWeb.dto.request.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.taivs.EcommerceWeb.utils.DobConstraint;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOwnProfile {

    @Size(min = 4, message = "USERNAME_INVALID")
    private String username;

    @JsonProperty("full_name")
    private String fullName;

    private String phone;

    @DobConstraint(min = 10, message = "INVALID_DOB")
    LocalDate dob;
}
