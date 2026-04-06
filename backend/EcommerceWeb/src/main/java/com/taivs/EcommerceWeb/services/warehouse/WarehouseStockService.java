package com.taivs.EcommerceWeb.services.warehouse;

import com.taivs.EcommerceWeb.models.warehouse.WarehouseStock;

import java.util.List;
import java.util.Map;

public interface WarehouseStockService {

    Long getAvailableStock(String warehouseId, String variantId);

    boolean hasSufficientStock(String warehouseId, String variantId, Long quantity);

    Map<String, Boolean> checkStockAvailability(String warehouseId, Map<String, Long> items); // variantId -> quantity

    void reserveStock(String warehouseId, String variantId, Long quantity);

    void reserveStock(String warehouseId, Map<String, Long> items); // variantId -> quantity

    void releaseReservation(String warehouseId, String variantId, Long quantity);

    void releaseReservation(String warehouseId, Map<String, Long> items);

    void shipStock(String warehouseId, String variantId, Long quantity);
    void shipStock(String warehouseId, Map<String, Long> items);

    Long getTotalAvailableStock(String variantId);

    List<WarehouseStock> getAvailableWarehousesForVariant(String variantId);

    WarehouseStock getWarehouseStock(String warehouseId, String variantId);

    WarehouseStock updateStockQuantity(String warehouseId, String variantId, Long newQuantity);

    void addStock(String warehouseId, String variantId, Long quantity);
}
