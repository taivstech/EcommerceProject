package com.taivs.EcommerceWeb.controllers.product;

import com.taivs.EcommerceWeb.dto.ApiResponse;
import com.taivs.EcommerceWeb.dto.response.product.ProductResponse;
import com.taivs.EcommerceWeb.services.product.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class RecommendationController {

        private final RecommendationService recommendationService;

        @GetMapping("/recommendations/for-you")
        @PreAuthorize("isAuthenticated()")
        public ApiResponse<List<ProductResponse>> forYou(
                        @RequestParam(defaultValue = "20") int limit) {
                String userId = SecurityContextHolder.getContext().getAuthentication().getName();
                return ApiResponse.<List<ProductResponse>>builder()
                                .result(recommendationService.getForYou(userId, limit))
                                .build();
        }

        @GetMapping("/{productId}/recommendations/similar")
        public ApiResponse<List<ProductResponse>> similar(
                        @PathVariable String productId,
                        @RequestParam(defaultValue = "10") int limit) {
                return ApiResponse.<List<ProductResponse>>builder()
                                .result(recommendationService.getSimilarProducts(productId, limit))
                                .build();
        }

        @GetMapping("/{productId}/recommendations/bought-together")
        public ApiResponse<List<ProductResponse>> boughtTogether(
                        @PathVariable String productId,
                        @RequestParam(defaultValue = "10") int limit) {
                return ApiResponse.<List<ProductResponse>>builder()
                                .result(recommendationService.getBoughtTogether(productId, limit))
                                .build();
        }
}
