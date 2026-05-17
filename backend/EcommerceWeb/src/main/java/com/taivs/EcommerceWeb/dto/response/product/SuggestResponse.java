package com.taivs.EcommerceWeb.dto.response.product;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuggestResponse {
    /** Curated popular/trending search terms from the search_suggestions DB table. */
    private List<String> popularTerms;
    /** Product name-based keyword hints derived from Elasticsearch hits. */
    private List<String> keywords;
    private List<ShopSuggestion> shops;
    private List<ProductSuggestion> products;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ShopSuggestion {
        private String id;
        private String name;
        private String logo;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductSuggestion {
        private String id;
        private String name;
        private BigDecimal minPrice;
        private String mainImageUrl;
        private Long totalSold;
    }
}
