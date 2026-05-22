package com.taivs.EcommerceWeb.serviceimpl.product;

import com.taivs.EcommerceWeb.models.product.Category;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.shop.Shop;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.json.JsonData;
import com.taivs.EcommerceWeb.models.product.DetailAttribute;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.product.ProductAttribute;
import com.taivs.EcommerceWeb.models.product.ProductImage;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.repositories.product.ProductRepository;
import com.taivs.EcommerceWeb.models.product.ProductDocument;
import com.taivs.EcommerceWeb.dto.response.product.ProductSearchResult;
import com.taivs.EcommerceWeb.repositories.product.ProductSearchRepository;
import com.taivs.EcommerceWeb.repositories.shop.ShopRepository;
import com.taivs.EcommerceWeb.dto.response.product.SuggestResponse;
import com.taivs.EcommerceWeb.services.product.ProductSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.client.elc.NativeQueryBuilder;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service("productSearchServiceImpl")
@ConditionalOnProperty(name = "app.search.elasticsearch.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class ProductSearchServiceImpl implements ProductSearchService {

    private final ProductRepository productRepository;
    private final ProductSearchRepository productSearchRepository;
    private final ElasticsearchOperations elasticsearchOperations;
    private final ShopRepository shopRepository;
    private final com.taivs.EcommerceWeb.services.product.SearchSuggestionService searchSuggestionService;

    @Override
    @Async
    public void reindexAllAsync() {
        reindexAll();
    }

    @Override
    @Async
    @Transactional(readOnly = true)
    public void indexProduct(String productId) {
        try {
            Optional<Product> productOpt = productRepository.findByIdWithAllRelations(productId);
            if (productOpt.isEmpty()) {
                log.warn("Product {} not found for indexing", productId);
                return;
            }

            Product product = productOpt.get();
            if (product.getDeletedAt() != null) {

                removeProduct(productId);
                return;
            }

            ProductDocument doc = toDocument(product);
            productSearchRepository.save(doc);
            log.debug("Indexed product {} in Elasticsearch", productId);
        } catch (Exception e) {
            log.error("Failed to index product {}: {}", productId, e.getMessage());
        }
    }

    @Override
    public void removeProduct(String productId) {
        try {
            productSearchRepository.deleteById(productId);
            log.debug("Removed product {} from Elasticsearch index", productId);
        } catch (Exception e) {
            log.error("Failed to remove product {} from index: {}", productId, e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public long reindexAll() {
        log.info("Starting full product reindex...");
        long count = 0;

        try {
            org.springframework.data.elasticsearch.core.IndexOperations indexOps = elasticsearchOperations
                    .indexOps(ProductDocument.class);
            if (indexOps.exists()) {
                indexOps.delete();
                log.info("Deleted corrupted or old index");
            }
            indexOps.create();
            indexOps.putMapping(indexOps.createMapping(ProductDocument.class));
            log.info("Created fresh index");

            int page = 0;
            int batchSize = 500;
            boolean hasMore = true;

            while (hasMore) {
                Pageable pageable = PageRequest.of(page, batchSize);
                Page<String> idPage = productRepository.findPublicProductIds(pageable);

                log.info("Page {}: Found {} IDs", page, idPage.getContent().size());

                if (idPage.isEmpty()) {
                    hasMore = false;
                    continue;
                }

                List<Product> products = productRepository.findAllByIdsWithAllRelations(idPage.getContent());

                List<ProductDocument> docs = products.stream()
                        .filter(p -> p.getDeletedAt() == null)
                        .map(this::toDocument)
                        .toList();

                if (!docs.isEmpty()) {
                    // Save one by one to skip bad documents instead of failing entire batch
                    int saved = 0;
                    int skipped = 0;
                    for (ProductDocument doc : docs) {
                        try {
                            productSearchRepository.save(doc);
                            saved++;
                        } catch (Exception ex) {
                            log.warn("Skipping product {} due to index error: {}", doc.getId(), ex.getMessage());
                            skipped++;
                        }
                    }
                    count += saved;
                    if (skipped > 0) {
                        log.warn("Batch page {}: saved={}, skipped={}", page, saved, skipped);
                    }
                    log.info("Reindex progress: {}/{} done", count, idPage.getTotalElements());
                }

                hasMore = idPage.hasNext();
                page++;
            }

            log.info("Full reindex completed. {} products indexed.", count);
        } catch (Exception e) {
            log.error("Full reindex failed: {}", e.getMessage(), e);
        }

        return count;
    }

    @Override
    public Page<ProductSearchResult> search(
            String query,
            String categoryId,
            String shopId,
            String province,
            Double minPrice,
            Double maxPrice,
            Double minRating,
            String brand,
            String sortBy,
            String sortDir,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size);

        BoolQuery.Builder boolBuilder = new BoolQuery.Builder();

        if (query != null && !query.isBlank()) {
            String q = query.trim();
            boolBuilder.must(m -> m
                    .bool(b -> b
                            .should(s -> s.matchPhrase(mp -> mp
                                    .field("name")
                                    .query(q)
                                    .boost(10.0f)))
                            .should(s -> s.match(mt -> mt
                                    .field("name.raw")
                                    .query(q)
                                    .boost(8.0f)))

                            // Semantic tag match — HIGHEST priority after exact name
                            // This is what makes "áo phông" find "Unisex Graphic Tee"
                            .should(s -> s.match(mt -> mt
                                    .field("tags")
                                    .query(q)
                                    .boost(6.0f)))

                            .should(s -> s.multiMatch(mm -> mm
                                    .query(q)
                                    .fields("name^5", "name.suggest^2", "tags^4", "description^1", "shopName^1.5",
                                            "variantNames^1.2", "attributeOptions^1")
                                    .type(co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType.BestFields)
                                    .fuzziness("AUTO")
                                    .prefixLength(2)))

                            .should(s -> s.multiMatch(mm -> mm
                                    .query(q)
                                    .fields("name^3", "tags^4", "description", "variantNames", "attributeOptions")
                                    .type(co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType.CrossFields)
                                    .operator(co.elastic.clients.elasticsearch._types.query_dsl.Operator.And)
                                    .boost(6.0f)))
                            .minimumShouldMatch("1")));
        }

        if (categoryId != null && !categoryId.isBlank()) {
            boolBuilder.filter(f -> f.term(t -> t.field("categoryId").value(categoryId.trim())));
        }

        if (shopId != null && !shopId.isBlank()) {
            boolBuilder.filter(f -> f.term(t -> t.field("shopId").value(shopId.trim())));
        }

        if (minPrice != null) {
            boolBuilder.filter(f -> f.range(r -> r.field("minPrice").gte(JsonData.of(minPrice))));
        }
        if (maxPrice != null) {
            boolBuilder.filter(f -> f.range(r -> r.field("maxPrice").lte(JsonData.of(maxPrice))));
        }

        if (province != null && !province.isBlank()) {
            boolBuilder.filter(f -> f.term(t -> t.field("shopProvince").value(province.trim()).caseInsensitive(true)));
        }

        // ─── Rating filter ────────────────────────────────────────────────────────
        if (minRating != null && minRating > 0) {
            boolBuilder.filter(f -> f.range(r -> r.field("avgRating").gte(JsonData.of(minRating))));
        }

        // ─── Brand filter ─────────────────────────────────────────────────────────
        if (brand != null && !brand.isBlank()) {
            boolBuilder.filter(f -> f.term(t -> t.field("brand").value(brand.trim()).caseInsensitive(true)));
        }

        NativeQueryBuilder nativeQueryBuilder = new NativeQueryBuilder()
                .withPageable(pageable);

        // ─── Function score — boost popular + highly rated products ───────────────
        if (query == null || query.isBlank()) {
            // Browse mode: apply function_score to rank by popularity * rating
            Query baseQuery = Query.of(q -> q.bool(boolBuilder.build()));
            co.elastic.clients.elasticsearch._types.query_dsl.FunctionScore soldFunc = co.elastic.clients.elasticsearch._types.query_dsl.FunctionScore
                    .of(f -> f
                            .fieldValueFactor(fvf -> fvf
                                    .field("totalSold")
                                    .factor(0.001)
                                    .modifier(
                                            co.elastic.clients.elasticsearch._types.query_dsl.FieldValueFactorModifier.Log1p)
                                    .missing(0.0)));
            co.elastic.clients.elasticsearch._types.query_dsl.FunctionScore ratingFunc = co.elastic.clients.elasticsearch._types.query_dsl.FunctionScore
                    .of(f -> f
                            .fieldValueFactor(fvf -> fvf
                                    .field("avgRating")
                                    .factor(0.5)
                                    .modifier(
                                            co.elastic.clients.elasticsearch._types.query_dsl.FieldValueFactorModifier.None)
                                    .missing(3.0)));
            Query functionScore = Query.of(q -> q.functionScore(fs -> fs
                    .query(baseQuery)
                    .functions(java.util.List.of(soldFunc, ratingFunc))
                    .boostMode(co.elastic.clients.elasticsearch._types.query_dsl.FunctionBoostMode.Multiply)));
            nativeQueryBuilder.withQuery(functionScore);
        } else {
            nativeQueryBuilder.withQuery(Query.of(q -> q.bool(boolBuilder.build())));
        }

        if (sortBy != null && !sortBy.isBlank()) {
            SortOrder order = "asc".equalsIgnoreCase(sortDir) ? SortOrder.Asc : SortOrder.Desc;
            String sortField = switch (sortBy.toLowerCase()) {
                case "price", "minprice" -> "minPrice";
                case "sold", "best_selling", "totalsold" -> "totalSold";
                case "rating", "top_rated", "avgrating" -> "avgRating";
                case "newest", "createdat" -> "createdAt";
                default -> "_score";
            };

            if (!"_score".equals(sortField)) {
                nativeQueryBuilder.withSort(s -> s.field(f -> f.field(sortField).order(order)));
            }
        }

        NativeQuery searchQuery = nativeQueryBuilder.build();

        SearchHits<ProductDocument> searchHits = elasticsearchOperations.search(
                searchQuery, ProductDocument.class);

        List<ProductSearchResult> results = searchHits.getSearchHits().stream()
                .map(this::toSearchResult)
                .toList();

        return new PageImpl<>(results, pageable, searchHits.getTotalHits());
    }

    @Override
    public List<String> suggest(String prefix, int limit) {
        if (prefix == null || prefix.isBlank() || prefix.trim().length() < 1) {
            return Collections.emptyList();
        }

        String trimmedPrefix = prefix.trim().toLowerCase();

        try {
            BoolQuery.Builder boolBuilder = new BoolQuery.Builder();

            // Prefix match on the edge-ngram suggest sub-field — most precise
            boolBuilder.should(s -> s
                    .matchPhrasePrefix(mpp -> mpp
                            .field("name.suggest")
                            .query(trimmedPrefix)
                            .boost(5.0f)
                            .maxExpansions(20)));

            // Exact prefix on the main name field (no fuzziness to avoid phong→phone)
            boolBuilder.should(s -> s
                    .matchPhrasePrefix(mpp -> mpp
                            .field("name")
                            .query(trimmedPrefix)
                            .boost(3.0f)
                            .maxExpansions(10)));

            boolBuilder.minimumShouldMatch("1");

            NativeQuery query = NativeQuery.builder()
                    .withQuery(Query.of(q -> q.bool(boolBuilder.build())))
                    .withPageable(PageRequest.of(0, Math.min(limit * 3, 50)))
                    .build();

            SearchHits<ProductDocument> hits = elasticsearchOperations.search(query, ProductDocument.class);

            List<String> suggestions = hits.getSearchHits().stream()
                    .map(h -> h.getContent().getName())
                    .filter(name -> name != null && !name.isBlank())
                    // Post-filter: keyword must actually contain the prefix (case-insensitive)
                    .filter(name -> name.toLowerCase().contains(trimmedPrefix))
                    .distinct()
                    .limit(limit)
                    .toList();

            log.debug("Suggest for '{}' returned {} results", trimmedPrefix, suggestions.size());
            return suggestions;

        } catch (Exception e) {
            log.warn("Elasticsearch suggest failed for prefix '{}': {}", trimmedPrefix, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    @Override
    public SuggestResponse suggestWithShops(String prefix, int limit) {
        List<String> keywords = Collections.emptyList();
        List<String> popularTerms = Collections.emptyList();
        List<SuggestResponse.ProductSuggestion> productSuggestions = Collections.emptyList();

        if (prefix != null && prefix.trim().length() >= 1) {
            String trimmedPrefix = prefix.trim().toLowerCase();

            // ── 1. Popular terms from DB (Shopee-style curated suggestions) ──────────
            try {
                popularTerms = searchSuggestionService.getSuggestions(trimmedPrefix, 5);
            } catch (Exception e) {
                log.warn("Popular suggest failed for '{}': {}", prefix, e.getMessage());
            }

            // ── 2. Product-based keywords from Elasticsearch (prefix only, NO fuzziness) ──
            try {
                BoolQuery.Builder boolBuilder = new BoolQuery.Builder();

                // Precise prefix match on edge-ngram suggest field
                boolBuilder.should(s -> s
                        .matchPhrasePrefix(mpp -> mpp
                                .field("name.suggest")
                                .query(trimmedPrefix)
                                .boost(5.0f)
                                .maxExpansions(20)));

                // Prefix match on main name field — no fuzzy to prevent phong→phone drift
                boolBuilder.should(s -> s
                        .matchPhrasePrefix(mpp -> mpp
                                .field("name")
                                .query(trimmedPrefix)
                                .boost(3.0f)
                                .maxExpansions(10)));

                // Prefix match on tags field for semantic keywords
                boolBuilder.should(s -> s
                        .matchPhrasePrefix(mpp -> mpp
                                .field("tags")
                                .query(trimmedPrefix)
                                .boost(4.0f)
                                .maxExpansions(20)));

                boolBuilder.minimumShouldMatch("1");

                NativeQuery query = NativeQuery.builder()
                        .withQuery(Query.of(q -> q.bool(boolBuilder.build())))
                        .withPageable(PageRequest.of(0, Math.min(limit * 3, 50)))
                        .build();

                SearchHits<ProductDocument> hits = elasticsearchOperations.search(query, ProductDocument.class);

                // Post-filter: extract ONLY tags that match the prefix
                // Product names are already shown in the products card section below
                keywords = hits.getSearchHits().stream()
                        .flatMap(h -> {
                            java.util.List<String> terms = new java.util.ArrayList<>();
                            // Add matching tags (short, relevant as search terms)
                            if (h.getContent().getTags() != null) {
                                h.getContent().getTags().stream()
                                    .filter(tag -> tag != null && !tag.isBlank()
                                            && tag.toLowerCase().contains(trimmedPrefix)
                                            && tag.length() <= 60) // cap length for readability
                                    .forEach(terms::add);
                            }
                            return terms.stream();
                        })
                        .distinct()
                        .limit(limit)
                        .toList();

                // Product card suggestions (image + price preview)
                productSuggestions = hits.getSearchHits().stream()
                        .map(h -> {
                            ProductDocument doc = h.getContent();
                            return SuggestResponse.ProductSuggestion.builder()
                                    .id(doc.getId())
                                    .name(doc.getName())
                                    .minPrice(doc.getMinPrice())
                                    .mainImageUrl(doc.getMainImageUrl())
                                    .totalSold(doc.getTotalSold())
                                    .build();
                        })
                        .limit(4)
                        .toList();

            } catch (Exception e) {
                log.warn("Elasticsearch suggest failed for '{}': {}", prefix, e.getMessage());
            }
        }

        // ── 3. Shop matches from DB ───────────────────────────────────────────────
        List<SuggestResponse.ShopSuggestion> shops = Collections.emptyList();
        if (prefix != null && prefix.trim().length() >= 1) {
            try {
                shops = shopRepository.searchByName(prefix.trim(), PageRequest.of(0, 3))
                        .stream()
                        .map(s -> SuggestResponse.ShopSuggestion.builder()
                                .id(s.getId())
                                .name(s.getName())
                                .logo(s.getLogo())
                                .build())
                        .toList();
            } catch (Exception e) {
                log.warn("Shop suggest failed for '{}': {}", prefix, e.getMessage());
            }
        }

        return SuggestResponse.builder()
                .popularTerms(popularTerms)
                .keywords(keywords)
                .shops(shops)
                .products(productSuggestions)
                .build();
    }

    private ProductDocument toDocument(Product product) {
        List<String> imageUrls = new ArrayList<>();
        String mainImageUrl = null;
        if (product.getImages() != null) {
            for (ProductImage img : product.getImages()) {
                imageUrls.add(img.getUrl());
                if (Boolean.TRUE.equals(img.getIsMain())) {
                    mainImageUrl = img.getUrl();
                }
            }
            if (mainImageUrl == null && !imageUrls.isEmpty()) {
                mainImageUrl = imageUrls.get(0);
            }
        }

        List<String> attributeOptions = new ArrayList<>();
        if (product.getAttributes() != null) {
            for (ProductAttribute attr : product.getAttributes()) {
                if (attr.getDetailAttributes() != null) {
                    for (DetailAttribute da : attr.getDetailAttributes()) {
                        attributeOptions.add(da.getName());
                    }
                }
            }
        }

        List<String> variantNames = new ArrayList<>();
        long totalStock = 0;
        if (product.getVariants() != null) {
            for (ProductVariant v : product.getVariants()) {
                if (v.getName() != null)
                    variantNames.add(v.getName());
                if (v.getStock() != null)
                    totalStock += v.getStock();
            }
        }

        // Fetch avg rating: prefer real reviews, fallback to Amazon pre-computed value
        BigDecimal avgRating = null;
        Long ratingCount = null;
        try {
            avgRating = productRepository.findAvgRatingByProductId(product.getId());
            if (avgRating != null) {
                avgRating = avgRating.multiply(BigDecimal.valueOf(10)).divide(BigDecimal.valueOf(10));
                ratingCount = productRepository.findRatingCountByProductId(product.getId());
            } else {
                // Fallback: use Amazon pre-computed rating stored on product entity
                avgRating = product.getAvgRating();
                ratingCount = product.getRatingCount();
            }
        } catch (Exception e) {
            log.warn("Failed to calculate avgRating for product {}: {}", product.getId(), e.getMessage());
            avgRating = product.getAvgRating();
            ratingCount = product.getRatingCount();
        }

        // Collect product tags (ElementCollection — already loaded via findByIdWithAllRelations
        // which uses JOIN FETCH for attributes/variants/images; tags use a separate join)
        List<String> tags = new ArrayList<>();
        try {
            if (product.getTags() != null) {
                product.getTags().stream()
                        .filter(t -> t != null && !t.isBlank())
                        .map(this::sanitizeText)
                        .filter(t -> t != null)
                        .forEach(tags::add);
            }
        } catch (Exception e) {
            log.debug("Could not load tags for product {}: {}", product.getId(), e.getMessage());
        }

        return ProductDocument.builder()
                .id(product.getId())
                .name(sanitizeText(product.getName()))
                .brand(sanitizeText(product.getBrand()))
                .description(sanitizeText(product.getDescription()))
                .minPrice(product.getMinPrice())
                .maxPrice(product.getMaxPrice())
                .shopId(product.getShop() != null ? product.getShop().getId() : null)
                .shopName(sanitizeText(product.getShop() != null ? product.getShop().getName() : null))
                .shopProvince(product.getShop() != null && product.getShop().getShopAddress() != null
                        ? product.getShop().getShopAddress().getProvince()
                        : null)
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(sanitizeText(product.getCategory() != null ? product.getCategory().getName() : null))
                .totalSold(product.getTotalSold())
                .createdAt(product.getCreatedAt())
                .mainImageUrl(mainImageUrl)
                .imageUrls(imageUrls)
                .weight(product.getWeight())
                .attributeOptions(attributeOptions.stream().map(this::sanitizeText)
                        .filter(s -> s != null && !s.isBlank()).toList())
                .variantNames(
                        variantNames.stream().map(this::sanitizeText).filter(s -> s != null && !s.isBlank()).toList())
                .variantCount(product.getVariants() != null ? product.getVariants().size() : 0)
                .totalStock(totalStock)
                .avgRating(avgRating)
                .ratingCount(ratingCount)
                .tags(tags)
                .build();
    }

    /**
     * Strips characters that cause Elasticsearch token offset errors.
     * Uses codePoints() to correctly handle emoji (surrogate pairs in Java UTF-16).
     */
    private String sanitizeText(String text) {
        if (text == null)
            return null;
        StringBuilder sb = new StringBuilder();
        text.codePoints()
                // Remove non-BMP (emoji, supplementary chars — code point > 0xFFFF)
                .filter(cp -> cp <= 0xFFFF)
                // Remove surrogate range (shouldn't exist as code points, but just in case)
                .filter(cp -> cp < 0xD800 || cp > 0xDFFF)
                // Remove control characters except tab and newline
                .filter(cp -> cp >= 0x20 || cp == 0x09 || cp == 0x0A)
                // Remove zero-width + bidi markers
                .filter(cp -> (cp < 0x200B || cp > 0x200F))
                .filter(cp -> (cp < 0x202A || cp > 0x202E))
                .filter(cp -> (cp < 0x2060 || cp > 0x206F))
                // Remove BOM and non-characters
                .filter(cp -> cp != 0xFEFF && cp != 0xFFFE && cp != 0xFFFF)
                // Remove Unicode format category characters (Cf)
                .filter(cp -> Character.getType(cp) != Character.FORMAT)
                .forEach(cp -> sb.appendCodePoint(cp));
        String cleaned = sb.toString().replaceAll("\\s+", " ").trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private ProductSearchResult toSearchResult(SearchHit<ProductDocument> hit) {
        ProductDocument doc = hit.getContent();
        return ProductSearchResult.builder()
                .id(doc.getId())
                .name(doc.getName())
                .description(doc.getDescription())
                .minPrice(doc.getMinPrice())
                .maxPrice(doc.getMaxPrice())
                .shopId(doc.getShopId())
                .shopName(doc.getShopName())
                .categoryId(doc.getCategoryId())
                .categoryName(doc.getCategoryName())
                .totalSold(doc.getTotalSold())
                .mainImageUrl(doc.getMainImageUrl())
                .imageUrls(doc.getImageUrls())
                .variantCount(doc.getVariantCount())
                .totalStock(doc.getTotalStock())
                .avgRating(doc.getAvgRating())
                .ratingCount(doc.getRatingCount())
                .brand(doc.getBrand())
                .score(hit.getScore() != Float.NaN ? (double) hit.getScore() : null)
                .build();
    }
}
