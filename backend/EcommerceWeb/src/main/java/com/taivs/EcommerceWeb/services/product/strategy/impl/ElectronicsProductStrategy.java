package com.taivs.EcommerceWeb.services.product.strategy.impl;

import com.taivs.EcommerceWeb.dto.request.product.ProductAttributeRequest;
import com.taivs.EcommerceWeb.dto.request.product.ProductCreateRequest;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.repositories.product.CategoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class ElectronicsProductStrategy extends AbstractProductStrategy {

    public ElectronicsProductStrategy(CategoryRepository categoryRepository) {
        super(categoryRepository);
    }

    @Override
    public void validate(ProductCreateRequest request) {
        if (request.getBrand() == null || request.getBrand().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Brand is required for electronics");
        }

        if (request.getAttributes() == null || request.getAttributes().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Model and Warranty attributes are required for electronics");
        }

        boolean hasModel = request.getAttributes().stream()
                .anyMatch(a -> "model".equalsIgnoreCase(a.getName().trim()) && a.getOptions() != null && !a.getOptions().isEmpty());
        if (!hasModel) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Model attribute is required for electronics");
        }

        ProductAttributeRequest warrantyAttr = request.getAttributes().stream()
                .filter(a -> "warranty".equalsIgnoreCase(a.getName().trim()))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Warranty attribute is required for electronics"));

        if (warrantyAttr.getOptions() == null || warrantyAttr.getOptions().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Warranty value cannot be empty");
        }

        String warrantyValue = warrantyAttr.getOptions().get(0).getName();
        if (!warrantyValue.matches("(?i)^(\\d+)\\s+(month|months|year|years)$")) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Invalid warranty format. Use e.g., '12 months' or '2 years'");
        }

        log.info("Electronics attributes successfully validated for: {}", request.getName());
    }

    @Override
    public void enrichProductData(Product product, ProductCreateRequest request) {
        super.enrichProductData(product, request);
        // Custom logic: Add an implicit tag if missing
        if (!product.getTags().contains("hàng chính hãng")) {
            product.getTags().add("hàng chính hãng");
        }
    }
}
