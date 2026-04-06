package com.taivs.EcommerceWeb.dto.request.product;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DetailAttributeOptionRequest {
    String name;
    String imageUrl;
}
