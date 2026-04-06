package com.taivs.EcommerceWeb.services.product;

import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.product.ProductDocument;
import com.taivs.EcommerceWeb.dto.response.product.ProductSearchResult;
import com.taivs.EcommerceWeb.dto.response.product.SuggestResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ProductSearchService {

    void indexProduct(String productId);

    void removeProduct(String productId);

    long reindexAll();

    Page<ProductSearchResult> search(
            String query,
            String categoryId,
            String shopId,
            String province,
            Double minPrice,
            Double maxPrice,
            String sortBy,
            String sortDir,
            int page,
            int size
    );

    List<String> suggest(String prefix, int limit);

    SuggestResponse suggestWithShops(String prefix, int limit);
}
