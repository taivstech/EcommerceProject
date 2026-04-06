package com.taivs.EcommerceWeb.repositories.product;

import com.taivs.EcommerceWeb.models.product.ProductDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface ProductSearchRepository extends ElasticsearchRepository<ProductDocument, String> {

    List<ProductDocument> findByShopId(String shopId);

    List<ProductDocument> findByCategoryId(String categoryId);

    void deleteByShopId(String shopId);
}
