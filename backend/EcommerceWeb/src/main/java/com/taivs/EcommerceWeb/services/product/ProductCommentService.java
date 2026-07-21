package com.taivs.EcommerceWeb.services.product;

import com.taivs.EcommerceWeb.dto.request.product.CreateCommentRequest;
import com.taivs.EcommerceWeb.dto.response.product.ProductCommentResponse;

import java.util.List;

public interface ProductCommentService {

    ProductCommentResponse createComment(CreateCommentRequest request);

    List<ProductCommentResponse> getComments(String productId, String parentId);

    void deleteComment(String commentId);
}
