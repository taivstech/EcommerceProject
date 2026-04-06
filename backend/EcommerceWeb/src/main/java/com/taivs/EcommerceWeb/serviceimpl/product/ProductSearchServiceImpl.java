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

import java.util.*;

@Service
@ConditionalOnProperty(name = "app.search.elasticsearch.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class ProductSearchServiceImpl implements ProductSearchService {

    private final ProductRepository productRepository;
    private final ProductSearchRepository productSearchRepository;
    private final ElasticsearchOperations elasticsearchOperations;
    private final ShopRepository shopRepository;


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
            productSearchRepository.deleteAll();

            int page = 0;
            int batchSize = 100;
            boolean hasMore = true;

            while (hasMore) {
                Pageable pageable = PageRequest.of(page, batchSize);
                Page<String> idPage = productRepository.findPublicProductIds(pageable);

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
                    productSearchRepository.saveAll(docs);
                    count += docs.size();
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
                                    .boost(10.0f)
                            ))
                            .should(s -> s.match(mt -> mt
                                    .field("name.raw")
                                    .query(q)
                                    .boost(8.0f)
                            ))

                            .should(s -> s.multiMatch(mm -> mm
                                    .query(q)
                                    .fields("name^5", "name.suggest^2", "description^1", "shopName^1.5", "variantNames^1.2", "attributeOptions^1")
                                    .type(co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType.BestFields)
                                    .fuzziness("AUTO")
                                    .prefixLength(2)
                            ))

                            .should(s -> s.multiMatch(mm -> mm
                                    .query(q)
                                    .fields("name^3", "description", "variantNames", "attributeOptions")
                                    .type(co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType.CrossFields)
                                    .operator(co.elastic.clients.elasticsearch._types.query_dsl.Operator.And)
                                    .boost(6.0f)
                            ))
                            .minimumShouldMatch("1")
                    )
            );
        }

        if (categoryId != null && !categoryId.isBlank()) {
            boolBuilder.filter(f -> f.term(t -> t.field("category_id").value(categoryId)));
        }

        if (shopId != null && !shopId.isBlank()) {
            boolBuilder.filter(f -> f.term(t -> t.field("shop_id").value(shopId)));
        }

        if (minPrice != null) {
            boolBuilder.filter(f -> f.range(r -> r.field("min_price").gte(JsonData.of(minPrice))));
        }
        if (maxPrice != null) {
            boolBuilder.filter(f -> f.range(r -> r.field("max_price").lte(JsonData.of(maxPrice))));
        }

        if (province != null && !province.isBlank()) {
            boolBuilder.filter(f -> f.term(t -> t.field("shop_province").value(province.trim())));
        }

        NativeQueryBuilder nativeQueryBuilder = new NativeQueryBuilder()
                .withQuery(Query.of(q -> q.bool(boolBuilder.build())))
                .withPageable(pageable);

        if (sortBy != null && !sortBy.isBlank()) {
            SortOrder order = "asc".equalsIgnoreCase(sortDir) ? SortOrder.Asc : SortOrder.Desc;
            String sortField = switch (sortBy.toLowerCase()) {
                case "price" -> "min_price";
                case "name" -> "name.keyword";
                case "sold" -> "total_sold";
                case "newest" -> "created_at";
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
        if (prefix == null || prefix.isBlank() || prefix.trim().length() < 2) {
            return Collections.emptyList();
        }

        String trimmedPrefix = prefix.trim().toLowerCase();

        try {

            BoolQuery.Builder boolBuilder = new BoolQuery.Builder();

            boolBuilder.should(s -> s
                    .matchPhrasePrefix(mpp -> mpp
                            .field("name.suggest")
                            .query(trimmedPrefix)
                            .boost(5.0f)
                            .maxExpansions(20)
                    )
            );

            boolBuilder.should(s -> s
                    .match(m -> m
                            .field("name")
                            .query(trimmedPrefix)
                            .fuzziness("AUTO")
                            .boost(3.0f)
                    )
            );

            boolBuilder.should(s -> s
                    .multiMatch(mm -> mm
                            .query(trimmedPrefix)
                            .fields("shop_name^1.5", "variant_names^1.2", "description^0.8")
                            .fuzziness("AUTO")
                    )
            );

            boolBuilder.minimumShouldMatch("1");

            NativeQuery query = NativeQuery.builder()
                    .withQuery(Query.of(q -> q.bool(boolBuilder.build())))
                    .withPageable(PageRequest.of(0, Math.min(limit * 3, 50)))
                    .build();

            SearchHits<ProductDocument> hits = elasticsearchOperations.search(query, ProductDocument.class);

            List<String> suggestions = hits.getSearchHits().stream()
                    .map(h -> h.getContent().getName())
                    .filter(name -> name != null && !name.isBlank())
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
        List<SuggestResponse.ProductSuggestion> productSuggestions = Collections.emptyList();

        if (prefix != null && prefix.trim().length() >= 2) {
            String trimmedPrefix = prefix.trim().toLowerCase();
            try {
                BoolQuery.Builder boolBuilder = new BoolQuery.Builder();
                boolBuilder.should(s -> s
                        .matchPhrasePrefix(mpp -> mpp
                                .field("name.suggest")
                                .query(trimmedPrefix)
                                .boost(5.0f)
                                .maxExpansions(20)));
                boolBuilder.should(s -> s
                        .match(m -> m
                                .field("name")
                                .query(trimmedPrefix)
                                .fuzziness("AUTO")
                                .boost(3.0f)));
                boolBuilder.should(s -> s
                        .multiMatch(mm -> mm
                                .query(trimmedPrefix)
                                .fields("shop_name^1.5", "variant_names^1.2", "description^0.8")
                                .fuzziness("AUTO")));
                boolBuilder.minimumShouldMatch("1");

                NativeQuery query = NativeQuery.builder()
                        .withQuery(Query.of(q -> q.bool(boolBuilder.build())))
                        .withPageable(PageRequest.of(0, Math.min(limit * 3, 50)))
                        .build();

                SearchHits<ProductDocument> hits = elasticsearchOperations.search(query, ProductDocument.class);

                keywords = hits.getSearchHits().stream()
                        .map(h -> h.getContent().getName())
                        .filter(name -> name != null && !name.isBlank())
                        .distinct()
                        .limit(limit)
                        .toList();

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

        List<SuggestResponse.ShopSuggestion> shops = Collections.emptyList();
        if (prefix != null && prefix.trim().length() >= 2) {
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
                if (v.getName() != null) variantNames.add(v.getName());
                if (v.getStock() != null) totalStock += v.getStock();
            }
        }

        return ProductDocument.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .minPrice(product.getMinPrice())
                .maxPrice(product.getMaxPrice())
                .shopId(product.getShop() != null ? product.getShop().getId() : null)
                .shopName(product.getShop() != null ? product.getShop().getName() : null)
                .shopProvince(product.getShop() != null && product.getShop().getShopAddress() != null
                        ? product.getShop().getShopAddress().getProvince() : null)
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .totalSold(product.getTotalSold())
                .createdAt(product.getCreatedAt())
                .mainImageUrl(mainImageUrl)
                .imageUrls(imageUrls)
                .weight(product.getWeight())
                .attributeOptions(attributeOptions)
                .variantNames(variantNames)
                .variantCount(product.getVariants() != null ? product.getVariants().size() : 0)
                .totalStock(totalStock)
                .build();
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
                .score(hit.getScore() != Float.NaN ? (double) hit.getScore() : null)
                .build();
    }
}
