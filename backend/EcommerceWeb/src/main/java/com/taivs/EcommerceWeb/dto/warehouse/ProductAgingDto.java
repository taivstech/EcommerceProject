package com.taivs.EcommerceWeb.dto.warehouse;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductAgingDto {
    String productId;
    String productName;
    String mainImageUrl;
    Long totalStock;
    Long totalSold;
    BigDecimal minPrice;
    BigDecimal maxPrice;
    LocalDateTime createdAt;
    Long daysInInventory;
    Double turnoverRate;
    String agingCategory;
}
