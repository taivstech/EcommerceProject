package com.taivs.EcommerceWeb.services.product.strategy;

import com.taivs.EcommerceWeb.dto.request.product.ProductCreateRequest;
import com.taivs.EcommerceWeb.models.product.Product;

public interface ProductCategoryStrategy {
    
    /**
     * Validate product creation request based on specific category rules.
     */
    void validate(ProductCreateRequest request);

    /**
     * Enrich product data with standard attributes or tags specific to the category.
     */
    void enrichProductData(Product product, ProductCreateRequest request);

    /**
     * Process variants according to category rules (e.g., auto-filling sizes).
     */
    void processVariants(Product product, ProductCreateRequest request);

    /**
     * Process and attach tags.
     */
    void processTags(Product product, java.util.List<String> tags, String categoryId);
}
