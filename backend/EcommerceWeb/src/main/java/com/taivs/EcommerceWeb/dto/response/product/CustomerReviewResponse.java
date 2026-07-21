package com.taivs.EcommerceWeb.dto.response.product;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CustomerReviewResponse {
    private String id;
    private Integer rating;
    private String comment;
    private String productVariantId;
    private String variantName;
    private String userId;
    private String userName;
    private String userAvatar;
    private String parentId;
    private java.util.List<CustomerReviewResponse> replies;
    private LocalDateTime createdAt;
}
