package com.taivs.EcommerceWeb.services.product.strategy.impl;

import com.taivs.EcommerceWeb.dto.request.product.ProductCreateRequest;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import com.taivs.EcommerceWeb.repositories.product.CategoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class HealthBeautyProductStrategy extends AbstractProductStrategy {

    public HealthBeautyProductStrategy(CategoryRepository categoryRepository) {
        super(categoryRepository);
    }

    @Override
    public void validate(ProductCreateRequest request) {
        if (request.getAttributes() == null || request.getAttributes().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Expiry date (HSD) and Origin are required for health & beauty products");
        }

        boolean hasExpiry = request.getAttributes().stream()
                .anyMatch(a -> a.getName().toLowerCase().contains("hsd") || a.getName().toLowerCase().contains("expiry"));
        
        if (!hasExpiry) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Expiry date (HSD) attribute is required");
        }
    }
}
