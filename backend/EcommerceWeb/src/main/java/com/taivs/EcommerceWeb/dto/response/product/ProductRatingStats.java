package com.taivs.EcommerceWeb.dto.response.product;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProductRatingStats {
    private String productId;
    private Double averageRating;
    private Long totalReviews;
}
