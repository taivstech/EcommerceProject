package com.taivs.EcommerceWeb.services.product;

import com.taivs.EcommerceWeb.dto.response.product.ProductResponse;

import java.util.List;

public interface RecommendationService {

    List<ProductResponse> getForYou(String userId, int limit);

    List<ProductResponse> getSimilarProducts(String productId, int limit);

    List<ProductResponse> getBoughtTogether(String productId, int limit);

    void warmUpCaches();
}
