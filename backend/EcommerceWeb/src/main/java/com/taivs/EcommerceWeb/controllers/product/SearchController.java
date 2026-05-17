package com.taivs.EcommerceWeb.controllers.product;

import com.taivs.EcommerceWeb.dto.response.product.ProductResponse;
import com.taivs.EcommerceWeb.services.product.ProductService;
import com.taivs.EcommerceWeb.dto.response.product.ProductSearchResult;
import com.taivs.EcommerceWeb.dto.response.product.SuggestResponse;
import com.taivs.EcommerceWeb.services.product.ProductSearchService;
import com.taivs.EcommerceWeb.services.product.SearchHistoryService;
import com.taivs.EcommerceWeb.repositories.shop.ShopRepository;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/search")
@Slf4j
public class SearchController {

    private final ProductSearchService productSearchService;
    private final SearchHistoryService searchHistoryService;
    private final ProductService productService;
    private final ShopRepository shopRepository;
    private final com.taivs.EcommerceWeb.services.product.SearchSuggestionService searchSuggestionService;

    public SearchController(
            @Qualifier("productSearchServiceImpl") ProductSearchService productSearchService,
            SearchHistoryService searchHistoryService,
            ProductService productService,
            ShopRepository shopRepository,
            com.taivs.EcommerceWeb.services.product.SearchSuggestionService searchSuggestionService) {

        this.productSearchService = productSearchService;
        this.searchHistoryService = searchHistoryService;
        this.productService = productService;
        this.shopRepository = shopRepository;
        this.searchSuggestionService = searchSuggestionService;
    }

    @GetMapping("/products")
    public ApiResponse<Page<ProductSearchResult>> searchProducts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String shopId,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String brand,
            @RequestParam(defaultValue = "relevance") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (page < 0)
            page = 0;
        if (size < 1 || size > 100)
            size = 20;
        if (q != null && q.length() > 500)
            q = q.substring(0, 500);
        if (minRating != null && (minRating < 1 || minRating > 5))
            minRating = null;
        if (brand != null && brand.isBlank())
            brand = null;

        try {
            Page<ProductSearchResult> esResult = productSearchService.search(
                    q, categoryId, shopId, province,
                    minPrice, maxPrice, minRating, brand,
                    sortBy, sortDir,
                    page, size);
            boolean hasActiveFilter = (q != null && !q.isBlank())
                    || (categoryId != null && !categoryId.isBlank())
                    || (shopId != null && !shopId.isBlank())
                    || (province != null && !province.isBlank())
                    || minPrice != null || maxPrice != null
                    || (minRating != null && minRating > 0)
                    || (brand != null && !brand.isBlank());

            if (esResult.isEmpty() && !hasActiveFilter) {
                log.info("ES returned zero results for unfiltered browse. Falling back to DB.");

                BigDecimal minPriceBD = minPrice != null ? BigDecimal.valueOf(minPrice) : null;
                BigDecimal maxPriceBD = maxPrice != null ? BigDecimal.valueOf(maxPrice) : null;
                String dbSortBy = "relevance".equalsIgnoreCase(sortBy) ? "createdAt" : sortBy;

                Page<ProductResponse> dbResult = productService.searchProducts(
                        null, null, null,
                        minPriceBD, maxPriceBD,
                        minRating, null,
                        dbSortBy, sortDir,
                        page, size);

                List<ProductSearchResult> convertedResults = dbResult.getContent().stream()
                        .map(this::toProductSearchResult)
                        .collect(Collectors.toList());

                return ApiResponse.<Page<ProductSearchResult>>builder()
                        .result(new PageImpl<>(convertedResults, dbResult.getPageable(), dbResult.getTotalElements()))
                        .build();
            }

            return ApiResponse.<Page<ProductSearchResult>>builder()
                    .result(esResult)
                    .build();

        } catch (Exception e) {
            log.error("Elasticsearch search failed ({}). Falling back to DB search.", e.getMessage());

            BigDecimal minPriceBD = minPrice != null ? BigDecimal.valueOf(minPrice) : null;
            BigDecimal maxPriceBD = maxPrice != null ? BigDecimal.valueOf(maxPrice) : null;
            String dbSortBy = "relevance".equalsIgnoreCase(sortBy) ? "createdAt" : sortBy;

            Page<ProductResponse> dbResult = productService.searchProducts(
                    q != null ? q.trim() : null,
                    categoryId,
                    shopId,
                    minPriceBD,
                    maxPriceBD,
                    minRating,
                    brand,
                    dbSortBy,
                    sortDir,
                    page,
                    size);

            List<ProductSearchResult> convertedResults = dbResult.getContent().stream()
                    .map(this::toProductSearchResult)
                    .collect(Collectors.toList());

            return ApiResponse.<Page<ProductSearchResult>>builder()
                    .result(new PageImpl<>(convertedResults, dbResult.getPageable(), dbResult.getTotalElements()))
                    .build();
        }
    }

    private ProductSearchResult toProductSearchResult(ProductResponse product) {
        String mainImageUrl = null;
        List<String> imageUrls = new java.util.ArrayList<>();
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            for (var img : product.getImages()) {
                String url = img.getUrl();
                if (url != null) {
                    imageUrls.add(url);
                    if (Boolean.TRUE.equals(img.getIsMain()) && mainImageUrl == null) {
                        mainImageUrl = url;
                    }
                }
            }
            if (mainImageUrl == null && !imageUrls.isEmpty()) {
                mainImageUrl = imageUrls.get(0);
            }
        }

        BigDecimal minPrice = BigDecimal.ZERO;
        BigDecimal maxPrice = BigDecimal.ZERO;

        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            List<BigDecimal> prices = product.getVariants().stream()
                    .filter(v -> v.getPrice() != null && v.getPrice().compareTo(BigDecimal.ZERO) > 0)
                    .map(v -> v.getPrice())
                    .collect(Collectors.toList());

            if (!prices.isEmpty()) {
                minPrice = prices.stream().min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
                maxPrice = prices.stream().max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            }
        } else {
            minPrice = product.getMinPrice() != null ? product.getMinPrice() : BigDecimal.ZERO;
            maxPrice = product.getMaxPrice() != null ? product.getMaxPrice() : BigDecimal.ZERO;
        }
        long totalStock = 0L;
        if (product.getVariants() != null) {
            totalStock = product.getVariants().stream()
                    .mapToLong(v -> v.getStock() != null ? v.getStock() : 0L)
                    .sum();
        }

        return ProductSearchResult.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .shopId(product.getShopId())
                .shopName(product.getShopName())
                .categoryId(product.getCategoryId())
                .totalSold(product.getTotalSold() != null ? product.getTotalSold() : 0L)
                .mainImageUrl(mainImageUrl)
                .imageUrls(imageUrls)
                .variantCount(product.getVariants() != null ? product.getVariants().size() : 0)
                .totalStock(totalStock)
                .build();
    }

    @GetMapping("/suggest")
    public ApiResponse<SuggestResponse> suggest(
            @RequestParam String q,
            @RequestParam(defaultValue = "8") int limit) {

        if (limit < 1 || limit > 20)
            limit = 8;
        if (q != null && q.length() > 200)
            q = q.substring(0, 200);

        return ApiResponse.<SuggestResponse>builder()
                .result(productSearchService.suggestWithShops(q, limit))
                .build();
    }

    @GetMapping("/provinces")
    public ApiResponse<List<String>> getProvinces() {
        return ApiResponse.<List<String>>builder()
                .result(shopRepository.findDistinctProvinces())
                .build();
    }

    @PostMapping("/reindex")
    // @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> reindex() {
        productSearchService.reindexAllAsync();
        return ApiResponse.<String>builder()
                .result("Reindex started in background. Check backend logs for progress.")
                .build();
    }

    @PostMapping("/history")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> saveSearch(@RequestParam String q) {
        if (q != null && !q.isBlank()) {
            searchHistoryService.save(q);
            // Also record in global suggestion corpus so real searches grow popularity
            searchSuggestionService.recordSearch(q.trim());
        }
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/history")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<String>> getRecentSearches() {
        return ApiResponse.<List<String>>builder()
                .result(searchHistoryService.getRecentSearches())
                .build();
    }

    @DeleteMapping("/history/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> deleteHistory(@PathVariable String id) {
        searchHistoryService.delete(id);
        return ApiResponse.<Void>builder().build();
    }

    @DeleteMapping("/history")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> clearHistory() {
        searchHistoryService.clearAll();
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/suggestions/popular")
    public ApiResponse<List<String>> getPopularSuggestions(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(defaultValue = "8") int limit) {
        if (limit < 1 || limit > 20)
            limit = 8;
        List<String> terms = q.isBlank()
                ? searchSuggestionService.getTopPopular(limit)
                : searchSuggestionService.getSuggestions(q.trim(), limit);
        return ApiResponse.<List<String>>builder().result(terms).build();
    }
}
