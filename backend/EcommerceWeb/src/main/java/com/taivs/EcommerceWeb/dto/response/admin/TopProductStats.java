package com.taivs.EcommerceWeb.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class TopProductStats {
    private String productId;
    private String productName;
    private String imageUrl;
    private long totalSold;
    private BigDecimal revenue;
}
