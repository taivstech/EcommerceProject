package com.taivs.EcommerceWeb.dto.response.product;

import com.taivs.EcommerceWeb.models.product.Category;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CategoryResponse {
    String id;
    String name;
    String description;
    String imageUrl;
}

