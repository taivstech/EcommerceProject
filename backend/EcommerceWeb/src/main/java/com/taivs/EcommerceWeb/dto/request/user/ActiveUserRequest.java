package com.taivs.EcommerceWeb.dto.request.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.Getter;

@Getter
public class ActiveUserRequest {

    @JsonProperty("user_id")
    private String userId;
}
