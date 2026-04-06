package com.taivs.EcommerceWeb.dto.request.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class DeactivateUser {

    @JsonProperty("user_id")
    private String userId;

}

