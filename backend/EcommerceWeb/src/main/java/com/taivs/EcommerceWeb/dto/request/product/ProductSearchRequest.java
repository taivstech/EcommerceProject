package com.taivs.EcommerceWeb.dto.request.product;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProductSearchRequest {
    private String keyword;
    private String categoryId;
    private String shopId;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private String sortBy = "createdAt";
    private String sortDir = "desc";
    private Integer page = 0;
    private Integer size = 20;
}
