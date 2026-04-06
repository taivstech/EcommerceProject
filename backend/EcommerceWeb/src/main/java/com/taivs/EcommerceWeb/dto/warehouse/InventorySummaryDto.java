package com.taivs.EcommerceWeb.dto.warehouse;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventorySummaryDto {
    Long totalProducts;
    Long totalVariants;
    Long totalStockUnits;
    Long totalSoldUnits;
    Long criticalStockItems;
    Long lowStockItems;
    Long outOfStockItems;
    Long deadStockItems;
    Double averageTurnoverRate;
}
