package com.taivs.EcommerceWeb.dto.response.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntrospectResponse {

    @JsonProperty("user_id")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String userId;

    private boolean valid;
}

