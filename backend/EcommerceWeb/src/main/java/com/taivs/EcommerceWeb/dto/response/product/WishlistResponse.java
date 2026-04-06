package com.taivs.EcommerceWeb.dto.response.product;

import com.taivs.EcommerceWeb.models.product.ProductImage;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class WishlistResponse {
    private String id;
    private String productId;
    private String productName;
    private String productImage;
    private java.math.BigDecimal productPrice;
    private LocalDateTime addedAt;
}
