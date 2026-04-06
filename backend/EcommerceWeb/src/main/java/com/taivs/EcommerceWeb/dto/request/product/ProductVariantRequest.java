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
public class ProductVariantRequest {
    String name;
    String sku;
    Double price;
    Long stock;
    String status;

    @Builder.Default
    List<String> optionNames = new ArrayList<>();

    @Builder.Default
    List<String> detailAttributeIds = new ArrayList<>();

    /**
     * Ordered list of image URLs for this variant.
     * The first element is treated as the main (representative) image.
     */
    @Builder.Default
    List<String> imageUrls = new ArrayList<>();

    /** Kept for backward-compat: if imageUrls is empty, this single URL is used as main image. */
    String imageUrl;
}
