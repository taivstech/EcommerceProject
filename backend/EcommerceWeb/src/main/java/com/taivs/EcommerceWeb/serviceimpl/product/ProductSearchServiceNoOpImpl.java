package com.taivs.EcommerceWeb.serviceimpl.product;

import com.taivs.EcommerceWeb.dto.response.product.ProductSearchResult;
import com.taivs.EcommerceWeb.dto.response.product.SuggestResponse;
import com.taivs.EcommerceWeb.services.product.ProductSearchService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.List;

@Service("productSearchServiceNoOpImpl")
@ConditionalOnProperty(name = "app.search.elasticsearch.enabled", havingValue = "false")
@Slf4j
public class ProductSearchServiceNoOpImpl implements ProductSearchService {

    @Override
    public void indexProduct(String productId) {
        log.debug("[NoOp] indexProduct skipped (ES disabled)");
    }

    @Override
    public void removeProduct(String productId) {
        log.debug("[NoOp] removeProduct skipped (ES disabled)");
    }

    @Override
    public long reindexAll() {
        log.debug("[NoOp] reindexAll skipped (ES disabled)");
        return 0;
    }

    @Override
    public void reindexAllAsync() {
        log.debug("[NoOp] reindexAllAsync skipped (ES disabled)");
    }

    @Override
    public Page<ProductSearchResult> search(
            String query, String categoryId, String shopId,
            String province, Double minPrice, Double maxPrice,
            Double minRating, String brand, String sortBy, String sortDir, int page, int size) {
        return Page.empty();
    }

    @Override
    public List<String> suggest(String prefix, int limit) {
        return List.of();
    }

    @Override
    public SuggestResponse suggestWithShops(String prefix, int limit) {
        return SuggestResponse.builder()
                .keywords(List.of())
                .shops(List.of())
                .products(List.of())
                .build();
    }
}
