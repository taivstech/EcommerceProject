package com.taivs.EcommerceWeb.services.product.strategy.impl;

import com.taivs.EcommerceWeb.dto.request.product.ProductAttributeRequest;
import com.taivs.EcommerceWeb.dto.request.product.ProductCreateRequest;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import com.taivs.EcommerceWeb.repositories.product.CategoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class FashionProductStrategy extends AbstractProductStrategy {

    private static final List<String> VALID_SIZES = List.of(
            "XS", "S", "M", "L", "XL", "XXL",
            "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45",
            "28", "30", "32", "34", "36", "38"
    );

    public FashionProductStrategy(CategoryRepository categoryRepository) {
        super(categoryRepository);
    }

    @Override
    public void validate(ProductCreateRequest request) {
        if (request.getBrand() == null || request.getBrand().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Brand is required for clothing/fashion");
        }

        if (request.getAttributes() == null || request.getAttributes().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Size attribute is required for clothing");
        }

        ProductAttributeRequest sizeAttr = request.getAttributes().stream()
                .filter(a -> "size".equalsIgnoreCase(a.getName().trim()))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Size attribute is required for clothing"));

        if (sizeAttr.getOptions() == null || sizeAttr.getOptions().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Size values cannot be empty");
        }

        for (var opt : sizeAttr.getOptions()) {
            String sizeName = opt.getName().toUpperCase().trim();
            if (!VALID_SIZES.contains(sizeName)) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Invalid clothing size: " + opt.getName() + ". Valid sizes are: " + VALID_SIZES);
            }
        }

        log.info("Clothing attributes successfully validated for: {}", request.getName());
    }
}
