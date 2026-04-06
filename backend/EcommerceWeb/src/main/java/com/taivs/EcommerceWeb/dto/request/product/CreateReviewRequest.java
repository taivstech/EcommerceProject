package com.taivs.EcommerceWeb.dto.request.product;

import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.user.User;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateReviewRequest {
    @NotBlank
    @JsonProperty("orderItemId")
    @JsonAlias({"order_item_id"})
    private String orderItemId;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer rating;

    private String comment;
}
