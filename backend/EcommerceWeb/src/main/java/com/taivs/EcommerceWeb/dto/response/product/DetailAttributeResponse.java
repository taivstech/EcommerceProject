package com.taivs.EcommerceWeb.dto.response.product;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DetailAttributeResponse {
    String id;
    String name;
    String imageUrl;
    Integer sortOrder;
}
