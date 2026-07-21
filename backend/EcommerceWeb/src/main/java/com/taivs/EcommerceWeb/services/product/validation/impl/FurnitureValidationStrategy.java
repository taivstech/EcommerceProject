package com.taivs.EcommerceWeb.services.product.validation.impl;

import com.taivs.EcommerceWeb.dto.request.product.ProductCreateRequest;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import com.taivs.EcommerceWeb.services.product.validation.ProductTypeValidationStrategy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Slf4j
public class FurnitureValidationStrategy implements ProductTypeValidationStrategy {

    @Override
    public void validate(ProductCreateRequest request) {
        if (request.getLength() == null || request.getLength().compareTo(BigDecimal.ZERO) <= 0 ||
            request.getWidth() == null || request.getWidth().compareTo(BigDecimal.ZERO) <= 0 ||
            request.getHeight() == null || request.getHeight().compareTo(BigDecimal.ZERO) <= 0 ||
            request.getWeight() == null || request.getWeight().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Complete positive dimensions (length, width, height, weight) are required for furniture");
        }

        log.info("Furniture dimensions successfully validated for: {}", request.getName());
    }
}
