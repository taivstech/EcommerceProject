package com.taivs.EcommerceWeb.serviceimpl.product;

import com.taivs.EcommerceWeb.dto.response.product.ProductResponse;
import com.taivs.EcommerceWeb.mappers.product.ProductMapper;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.repositories.product.CustomerReviewRepository;
import com.taivs.EcommerceWeb.repositories.order.OrderItemRepository;
import com.taivs.EcommerceWeb.repositories.product.ProductRepository;
import com.taivs.EcommerceWeb.services.product.RecommendationService;
import com.taivs.EcommerceWeb.services.product.RecentlyViewedService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RecommendationServiceImpl implements RecommendationService {

    private static final String CACHE_PREFIX_FOR_YOU = "rec:foryou:";
    private static final String CACHE_PREFIX_SIMILAR = "rec:similar:";
    private static final String CACHE_PREFIX_BOUGHT = "rec:bought:";
    private static final long CACHE_TTL_MINUTES = 30;

    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final CustomerReviewRepository reviewRepository;
    private final RecentlyViewedService recentlyViewedService;
    private final ProductMapper productMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    private final RestTemplate restTemplate;

    @Value("${app.recommendation.url:http://localhost:8000/api/recommendations}")
    private String recommendationBaseUrl;

    @Override
    public List<ProductResponse> getForYou(String userId, int limit) {
        String cacheKey = CACHE_PREFIX_FOR_YOU + userId;
        List<String> cached = getCachedIds(cacheKey);
        if (cached != null) {
            return loadProductResponses(cached.stream().limit(limit).toList());
        }

        List<String> topIds = callRecommendationApi("/for-you/" + userId, limit);
        if (topIds.isEmpty()) {
            topIds = computeForYouFallback(userId, limit);
        }

        cacheIds(cacheKey, topIds);
        return loadProductResponses(topIds);
    }

    @Override
    public List<ProductResponse> getSimilarProducts(String productId, int limit) {
        String cacheKey = CACHE_PREFIX_SIMILAR + productId;
        List<String> cached = getCachedIds(cacheKey);
        if (cached != null) {
            return loadProductResponses(cached.stream().limit(limit).toList());
        }

        List<String> topIds = callRecommendationApi("/similar/" + productId, limit);
        if (topIds.isEmpty()) {
            topIds = computeSimilarFallback(productId, limit);
        }

        cacheIds(cacheKey, topIds);
        return loadProductResponses(topIds);
    }

    @Override
    public List<ProductResponse> getBoughtTogether(String productId, int limit) {
        String cacheKey = CACHE_PREFIX_BOUGHT + productId;
        List<String> cached = getCachedIds(cacheKey);
        if (cached != null) {
            return loadProductResponses(cached.stream().limit(limit).toList());
        }

        List<String> topIds = callRecommendationApi("/bought-together/" + productId, limit);
        if (topIds.isEmpty()) {
            topIds = productRepository.findFrequentlyBoughtTogetherIds(
                    productId, PageRequest.of(0, limit));

            if (topIds.isEmpty()) {
                Product source = productRepository.findById(productId).orElse(null);
                if (source != null && source.getCategory() != null) {
                    topIds = productRepository.findByCategoryIdAndIdNot(
                            source.getCategory().getId(), productId, PageRequest.of(1, limit))
                            .getContent();
                }
            }
        }

        cacheIds(cacheKey, topIds);
        return loadProductResponses(topIds);
    }

    @Override
    @Scheduled(fixedRate = 6 * 60 * 60 * 1000, initialDelay = 60_000)
    public void warmUpCaches() {
        log.info("Recommendation cache warm-up started");
        long start = System.currentTimeMillis();

        List<String> topProductIds = productRepository.findTopProductIdsByTotalSold(PageRequest.of(0, 200));
        for (String pid : topProductIds) {
            try {
                getBoughtTogether(pid, 10);
                getSimilarProducts(pid, 10);
                // Small delay to avoid slamming the Python service
                Thread.sleep(50);
            } catch (Exception e) {
                log.warn("Cache warm-up failed for product {}: {}", pid, e.getMessage());
            }
        }

        log.info("Recommendation cache warm-up completed in {}ms", System.currentTimeMillis() - start);
    }

    private List<String> callRecommendationApi(String endpoint, int limit) {
        String url = recommendationBaseUrl + endpoint + "?n=" + limit;
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> recs = (List<Map<String, Object>>) response.getBody().get("recommendations");
                if (recs != null && !recs.isEmpty()) {
                    return recs.stream()
                            .map(r -> (String) r.get("product_id"))
                            .toList();
                }
            }
        } catch (Exception e) {
            log.warn("ML recommendation API unavailable at {}, using local DB fallback: {}", url, e.getMessage());
        }
        return Collections.emptyList();
    }

    private List<String> computeForYouFallback(String userId, int limit) {
        Set<String> categoryIds = new LinkedHashSet<>();
        try {
            List<String> viewedIds = recentlyViewedService.getRecentlyViewedProductIds();
            if (!viewedIds.isEmpty()) {
                List<Object[]> viewedCats = productRepository.findCategoryIdsByProductIds(viewedIds);
                for (Object[] row : viewedCats) {
                    categoryIds.add((String) row[0]);
                }
            }
        } catch (Exception ignored) {
        }

        List<Object[]> purchaseData = productRepository.findPurchasedProductDataByUserId(userId);
        Set<String> purchasedIds = new HashSet<>();
        for (Object[] row : purchaseData) {
            purchasedIds.add((String) row[0]);
            categoryIds.add((String) row[1]);
        }

        Set<String> candidateIds = new LinkedHashSet<>();

        if (!categoryIds.isEmpty()) {
            List<String> catProducts = productRepository.findProductIdsByCategoryIds(
                    new ArrayList<>(categoryIds).subList(0, Math.min(5, categoryIds.size())),
                    PageRequest.of(0, limit * 3));
            candidateIds.addAll(catProducts);
        }

        List<String> topRated = productRepository.findTopRatedProductIds(PageRequest.of(0, limit));
        candidateIds.addAll(topRated);

        candidateIds.addAll(
                productRepository.findTrendingProductIds(
                        LocalDateTime.now().minusDays(7), PageRequest.of(0, limit)).getContent());

        candidateIds.removeAll(purchasedIds);

        if (candidateIds.isEmpty()) {
            return productRepository.findTopByTotalSold(PageRequest.of(0, limit))
                    .getContent();
        }

        return candidateIds.stream().limit(limit).toList();
    }

    private List<String> computeSimilarFallback(String productId, int limit) {
        Product source = productRepository.findById(productId).orElse(null);
        if (source == null || source.getCategory() == null) {
            return productRepository.findTopByTotalSold(PageRequest.of(0, limit))
                    .getContent();
        }

        List<String> sameCategoryIds = productRepository.findByCategoryIdAndIdNot(
                source.getCategory().getId(), productId, PageRequest.of(0, limit))
                .getContent();

        if (sameCategoryIds.size() >= limit) {
            return sameCategoryIds;
        }

        Set<String> result = new LinkedHashSet<>(sameCategoryIds);
        List<String> boughtTogether = productRepository.findFrequentlyBoughtTogetherIds(
                productId, PageRequest.of(0, limit));
        result.addAll(boughtTogether);

        if (result.size() < limit) {
            List<String> trending = productRepository.findTrendingProductIds(
                    LocalDateTime.now().minusDays(14), PageRequest.of(0, limit)).getContent();
            result.addAll(trending);
        }

        result.remove(productId);
        return result.stream().limit(limit).toList();
    }

    @SuppressWarnings("unchecked")
    private List<String> getCachedIds(String cacheKey) {
        try {
            List<String> cached = (List<String>) redisTemplate.opsForValue().get(cacheKey);
            if (cached != null && !cached.isEmpty())
                return cached;
        } catch (Exception ignored) {
        }
        return null;
    }

    private void cacheIds(String cacheKey, List<String> ids) {
        if (!ids.isEmpty()) {
            try {
                redisTemplate.opsForValue().set(cacheKey, new ArrayList<>(ids), CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            } catch (Exception ignored) {
            }
        }
    }

    private List<ProductResponse> loadProductResponses(List<String> productIds) {
        if (productIds.isEmpty())
            return Collections.emptyList();

        // Use findAllBasicByIds which eagerly JOIN FETCHes shop, category, and images
        // in a single query, avoiding N+1 SELECT issues from the default findAllById
        List<Product> products = productRepository.findAllBasicByIds(productIds);

        Map<String, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        return productIds.stream()
                .map(productMap::get)
                .filter(Objects::nonNull)
                .map(productMapper::toResponse)
                .toList();
    }
}
