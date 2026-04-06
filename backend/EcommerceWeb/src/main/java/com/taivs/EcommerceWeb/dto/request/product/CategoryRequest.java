package com.taivs.EcommerceWeb.dto.request.product;

import com.taivs.EcommerceWeb.models.product.Category;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CategoryRequest {
    @NotBlank
    String name;
    String description;
    String imageUrl;
}

