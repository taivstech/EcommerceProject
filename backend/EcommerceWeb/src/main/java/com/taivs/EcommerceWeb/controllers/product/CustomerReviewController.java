package com.taivs.EcommerceWeb.controllers.product;

import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.dto.request.product.CreateReviewRequest;
import com.taivs.EcommerceWeb.dto.request.product.CreateReplyRequest;
import com.taivs.EcommerceWeb.dto.response.product.CustomerReviewResponse;
import com.taivs.EcommerceWeb.dto.response.product.ProductRatingStats;
import com.taivs.EcommerceWeb.services.product.CustomerReviewService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class CustomerReviewController {
    private final CustomerReviewService customerReviewService;

    @PostMapping
    @PreAuthorize("hasAuthority('review:create') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<CustomerReviewResponse> createReview(@RequestBody @Valid CreateReviewRequest request) {
        log.info("Received review request - orderItemId: '{}', rating: {}, comment: '{}'",
                request.getOrderItemId(), request.getRating(), request.getComment());
        log.debug("Request object: {}", request);
        return ApiResponse.<CustomerReviewResponse>builder()
                .result(customerReviewService.createReview(request))
                .build();
    }

    @GetMapping("/product/{productId}")
    public ApiResponse<List<CustomerReviewResponse>> getProductReviews(@PathVariable("productId") String productId) {
        return ApiResponse.<List<CustomerReviewResponse>>builder()
                .result(customerReviewService.getProductReviews(productId))
                .build();
    }

    @GetMapping("/product/{productId}/stats")
    public ApiResponse<ProductRatingStats> getProductRatingStats(@PathVariable("productId") String productId) {
        return ApiResponse.<ProductRatingStats>builder()
                .result(customerReviewService.getProductRatingStats(productId))
                .build();
    }

    @PostMapping("/{id}/reply")
    @PreAuthorize("hasAuthority('review:create') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<CustomerReviewResponse> replyReview(
            @PathVariable("id") String id,
            @RequestBody @Valid CreateReplyRequest request) {
        return ApiResponse.<CustomerReviewResponse>builder()
                .result(customerReviewService.replyToReview(id, request))
                .build();
    }
}
