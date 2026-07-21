package com.taivs.EcommerceWeb.dto.response.product;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ProductCommentResponse {
    private String id;
    private String content;
    private String productId;
    private String userId;
    private String userName;
    private String userAvatar;
    private Integer leftValue;
    private Integer rightValue;
    private String parentId;
    private LocalDateTime createdAt;
}
