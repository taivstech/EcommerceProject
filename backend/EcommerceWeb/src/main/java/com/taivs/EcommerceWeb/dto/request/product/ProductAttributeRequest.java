package com.taivs.EcommerceWeb.dto.request.product;

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
public class ProductAttributeRequest {
    String name;

    @Builder.Default
    List<DetailAttributeOptionRequest> options = new ArrayList<>();
}
