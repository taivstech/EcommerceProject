package com.taivs.EcommerceWeb.dto.request.product;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateReplyRequest {
    @NotBlank
    private String comment;
}
