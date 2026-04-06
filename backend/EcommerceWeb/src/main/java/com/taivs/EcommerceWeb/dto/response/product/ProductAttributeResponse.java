package com.taivs.EcommerceWeb.dto.response.product;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductAttributeResponse {
    String id;
    String name;
    Integer sortOrder;

    @Builder.Default
    List<DetailAttributeResponse> options = new ArrayList<>();
}
