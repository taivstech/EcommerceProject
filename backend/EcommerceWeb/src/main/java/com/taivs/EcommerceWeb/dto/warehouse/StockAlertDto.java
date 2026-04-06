package com.taivs.EcommerceWeb.dto.warehouse;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StockAlertDto {
    String productId;
    String productName;
    String variantId;
    String variantName;
    String sku;
    Long currentStock;
    Long soldCount;
    BigDecimal price;
    String alertLevel;
    String mainImageUrl;
}
