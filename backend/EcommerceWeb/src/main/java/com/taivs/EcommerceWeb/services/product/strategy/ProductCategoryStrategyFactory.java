package com.taivs.EcommerceWeb.services.product.strategy;

import com.taivs.EcommerceWeb.services.product.strategy.impl.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProductCategoryStrategyFactory {

    private final ElectronicsProductStrategy electronicsStrategy;
    private final FashionProductStrategy fashionStrategy;
    private final HomeLivingProductStrategy homeLivingStrategy;
    private final HealthBeautyProductStrategy healthBeautyStrategy;
    private final DefaultProductStrategy defaultStrategy;

    public ProductCategoryStrategy getStrategy(String categoryName) {
        if (categoryName == null) return defaultStrategy;

        String lower = categoryName.trim().toLowerCase();
        
        if (lower.contains("electronic") || lower.contains("điện tử") || lower.contains("thiết bị số") || lower.contains("điện thoại")) {
            return electronicsStrategy;
        } else if (lower.contains("cloth") || lower.contains("quần áo") || lower.contains("thời trang") || lower.contains("giày dép")) {
            return fashionStrategy;
        } else if (lower.contains("furniture") || lower.contains("nội thất") || lower.contains("bàn ghế") || lower.contains("nhà cửa") || lower.contains("đồ gia dụng")) {
            return homeLivingStrategy;
        } else if (lower.contains("mỹ phẩm") || lower.contains("sức khỏe") || lower.contains("làm đẹp") || lower.contains("health") || lower.contains("beauty")) {
            return healthBeautyStrategy;
        }

        return defaultStrategy;
    }
}
