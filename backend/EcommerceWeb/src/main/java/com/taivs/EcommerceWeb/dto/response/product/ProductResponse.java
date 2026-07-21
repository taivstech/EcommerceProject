package com.taivs.EcommerceWeb.dto.response.product;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductResponse {
    String id;
    String name;
    String brand;
    String description;

    @JsonProperty("min_price")
    BigDecimal minPrice;

    @JsonProperty("max_price")
    BigDecimal maxPrice;

    BigDecimal weight;
    BigDecimal length;
    BigDecimal width;
    BigDecimal height;

    String shopId;
    
    @JsonProperty("shop_name")
    String shopName;
    
    String categoryId;

    LocalDateTime createdAt;

    Long totalSold;

    @JsonProperty("avg_rating")
    BigDecimal avgRating;

    @JsonProperty("rating_count")
    Long ratingCount;

    @JsonProperty("is_draft")
    boolean isDraft;

    @JsonProperty("is_published")
    boolean isPublished;

    @Builder.Default
    List<ProductImageResponse> images = new ArrayList<>();

    @Builder.Default
    List<ProductVariantResponse> variants = new ArrayList<>();

    @Builder.Default
    List<ProductAttributeResponse> attributes = new ArrayList<>();
}
