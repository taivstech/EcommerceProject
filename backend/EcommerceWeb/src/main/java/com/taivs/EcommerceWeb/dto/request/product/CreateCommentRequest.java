package com.taivs.EcommerceWeb.dto.request.product;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCommentRequest {

    @NotBlank(message = "Product ID is required")
    @JsonProperty("productId")
    private String productId;

    @NotBlank(message = "Comment content cannot be blank")
    private String content;

    @JsonProperty("parentId")
    private String parentId;
}
