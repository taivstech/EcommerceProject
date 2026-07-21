package com.taivs.EcommerceWeb.controllers.product;

import com.taivs.EcommerceWeb.dto.ApiResponse;
import com.taivs.EcommerceWeb.dto.request.product.CreateCommentRequest;
import com.taivs.EcommerceWeb.dto.response.product.ProductCommentResponse;
import com.taivs.EcommerceWeb.services.product.ProductCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/comments")
@RequiredArgsConstructor
public class ProductCommentController {

    private final ProductCommentService commentService;

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<ProductCommentResponse> createComment(@RequestBody @Valid CreateCommentRequest request) {
        log.info("Received request to create comment on product ID: {}", request.getProductId());
        return ApiResponse.<ProductCommentResponse>builder()
                .result(commentService.createComment(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<ProductCommentResponse>> getComments(
            @RequestParam("productId") String productId,
            @RequestParam(value = "parentId", required = false) String parentId
    ) {
        log.info("Fetching comments for product ID: {}, parent ID: {}", productId, parentId);
        return ApiResponse.<List<ProductCommentResponse>>builder()
                .result(commentService.getComments(productId, parentId))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> deleteComment(@PathVariable("id") String id) {
        log.info("Request to delete comment ID: {}", id);
        commentService.deleteComment(id);
        return ApiResponse.<Void>builder().build();
    }
}
