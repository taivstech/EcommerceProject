package com.taivs.EcommerceWeb.services.product.validation;

import com.taivs.EcommerceWeb.services.product.validation.impl.ClothingValidationStrategy;
import com.taivs.EcommerceWeb.services.product.validation.impl.ElectronicsValidationStrategy;
import com.taivs.EcommerceWeb.services.product.validation.impl.FurnitureValidationStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ProductValidationStrategyFactory {

    private final ElectronicsValidationStrategy electronicsStrategy;
    private final ClothingValidationStrategy clothingStrategy;
    private final FurnitureValidationStrategy furnitureStrategy;

    public Optional<ProductTypeValidationStrategy> getStrategy(String categoryName) {
        if (categoryName == null) return Optional.empty();

        String lower = categoryName.trim().toLowerCase();
        if (lower.contains("electronic") || lower.contains("điện tử") || lower.contains("thiết bị số")) {
            return Optional.of(electronicsStrategy);
        } else if (lower.contains("cloth") || lower.contains("quần áo") || lower.contains("thời trang")) {
            return Optional.of(clothingStrategy);
        } else if (lower.contains("furniture") || lower.contains("nội thất") || lower.contains("bàn ghế")) {
            return Optional.of(furnitureStrategy);
        }

        return Optional.empty();
    }
}
