package com.taivs.EcommerceWeb.dto.response.product;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSearchResult {
    private String id;
    private String name;
    private String description;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private String shopId;
    private String shopName;
    private String categoryId;
    private String categoryName;
    private Long totalSold;
    private String mainImageUrl;
    private List<String> imageUrls;
    private Integer variantCount;
    private Long totalStock;
    private Double score;    // Elasticsearch relevance score
}
