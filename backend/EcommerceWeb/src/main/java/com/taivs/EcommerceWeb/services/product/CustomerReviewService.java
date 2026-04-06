package com.taivs.EcommerceWeb.services.product;

import com.taivs.EcommerceWeb.dto.request.product.CreateReviewRequest;
import com.taivs.EcommerceWeb.dto.response.product.CustomerReviewResponse;
import com.taivs.EcommerceWeb.dto.response.product.ProductRatingStats;

import java.util.List;

public interface CustomerReviewService {

    CustomerReviewResponse createReview(CreateReviewRequest request);

    List<CustomerReviewResponse> getProductReviews(String productId);

    ProductRatingStats getProductRatingStats(String productId);
}
