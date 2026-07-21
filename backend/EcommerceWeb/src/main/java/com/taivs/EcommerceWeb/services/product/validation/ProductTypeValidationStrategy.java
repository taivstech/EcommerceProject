package com.taivs.EcommerceWeb.services.product.validation;

import com.taivs.EcommerceWeb.dto.request.product.ProductCreateRequest;

public interface ProductTypeValidationStrategy {
    void validate(ProductCreateRequest request);
}
