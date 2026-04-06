package com.taivs.EcommerceWeb.serviceimpl.warehouse;

import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.repositories.product.ProductVariantRepository;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.models.warehouse.WarehouseStock;
import com.taivs.EcommerceWeb.repositories.warehouse.WarehouseRepository;
import com.taivs.EcommerceWeb.repositories.warehouse.WarehouseStockRepository;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseStockService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class WarehouseStockServiceImpl implements WarehouseStockService {

    private final WarehouseStockRepository warehouseStockRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductVariantRepository productVariantRepository;

    @Override
    public Long getAvailableStock(String warehouseId, String variantId) {
        return warehouseStockRepository
                .findByWarehouseIdAndVariantId(warehouseId, variantId)
                .map(WarehouseStock::getAvailableQuantity)
                .orElse(0L);
    }

    @Override
    public boolean hasSufficientStock(String warehouseId, String variantId, Long quantity) {
        return getAvailableStock(warehouseId, variantId) >= quantity;
    }

    @Override
    public Map<String, Boolean> checkStockAvailability(String warehouseId, Map<String, Long> items) {
        Map<String, Boolean> result = new HashMap<>();
        List<WarehouseStock> stocks = warehouseStockRepository.findByWarehouseIdAndVariantIds(
                warehouseId,
                items.keySet().stream().toList()
        );

        Map<String, WarehouseStock> stockMap = stocks.stream()
                .collect(Collectors.toMap(
                        ws -> ws.getProductVariant().getId(),
                        ws -> ws
                ));

        for (Map.Entry<String, Long> entry : items.entrySet()) {
            String variantId = entry.getKey();
            Long quantity = entry.getValue();
            WarehouseStock stock = stockMap.get(variantId);
            result.put(variantId, stock != null && stock.hasAvailableStock(quantity));
        }

        return result;
    }

    @Override
    @Transactional
    public void reserveStock(String warehouseId, String variantId, Long quantity) {
        WarehouseStock stock = getWarehouseStockOrCreate(warehouseId, variantId);
        stock.reserve(quantity);
        warehouseStockRepository.save(stock);
        updateVariantTotalStock(variantId);
        log.info("Reserved {} units of variant {} in warehouse {}", quantity, variantId, warehouseId);
    }

    @Override
    @Transactional
    public void reserveStock(String warehouseId, Map<String, Long> items) {
        for (Map.Entry<String, Long> entry : items.entrySet()) {
            reserveStock(warehouseId, entry.getKey(), entry.getValue());
        }
    }

    @Override
    @Transactional
    public void releaseReservation(String warehouseId, String variantId, Long quantity) {
        WarehouseStock stock = warehouseStockRepository
                .findByWarehouseIdAndVariantId(warehouseId, variantId)
                .orElse(null);

        if (stock != null) {
            stock.releaseReservation(quantity);
            warehouseStockRepository.save(stock);
            updateVariantTotalStock(variantId);
            log.info("Released reservation of {} units of variant {} in warehouse {}", quantity, variantId, warehouseId);
        }
    }

    @Override
    @Transactional
    public void releaseReservation(String warehouseId, Map<String, Long> items) {
        for (Map.Entry<String, Long> entry : items.entrySet()) {
            releaseReservation(warehouseId, entry.getKey(), entry.getValue());
        }
    }

    @Override
    @Transactional
    public void shipStock(String warehouseId, String variantId, Long quantity) {
        WarehouseStock stock = warehouseStockRepository
                .findByWarehouseIdAndVariantId(warehouseId, variantId)
                .orElseThrow(() -> new AppException(ErrorCode.ENTITY_NOT_FOUND, "Warehouse stock not found"));

        stock.ship(quantity);
        warehouseStockRepository.save(stock);
        updateVariantTotalStock(variantId);
        log.info("Shipped {} units of variant {} from warehouse {}", quantity, variantId, warehouseId);
    }

    @Override
    @Transactional
    public void shipStock(String warehouseId, Map<String, Long> items) {
        for (Map.Entry<String, Long> entry : items.entrySet()) {
            shipStock(warehouseId, entry.getKey(), entry.getValue());
        }
    }

    @Override
    public Long getTotalAvailableStock(String variantId) {
        return warehouseStockRepository.getTotalAvailableStockForVariant(variantId);
    }

    @Override
    public List<WarehouseStock> getAvailableWarehousesForVariant(String variantId) {
        return warehouseStockRepository.findAvailableStockForVariant(variantId);
    }

    @Override
    public WarehouseStock getWarehouseStock(String warehouseId, String variantId) {
        return warehouseStockRepository
                .findByWarehouseIdAndVariantId(warehouseId, variantId)
                .orElse(null);
    }

    @Override
    @Transactional
    public WarehouseStock updateStockQuantity(String warehouseId, String variantId, Long newQuantity) {
        WarehouseStock stock = getWarehouseStockOrCreate(warehouseId, variantId);
        stock.setStockQuantity(newQuantity);
        WarehouseStock saved = warehouseStockRepository.save(stock);
        updateVariantTotalStock(variantId);
        return saved;
    }

    @Override
    @Transactional
    public void addStock(String warehouseId, String variantId, Long quantity) {
        WarehouseStock stock = getWarehouseStockOrCreate(warehouseId, variantId);
        stock.setStockQuantity(stock.getStockQuantity() + quantity);
        warehouseStockRepository.save(stock);
        updateVariantTotalStock(variantId);
        log.info("Added {} units back to stock for variant {} in warehouse {}", quantity, variantId, warehouseId);
    }
    private WarehouseStock getWarehouseStockOrCreate(String warehouseId, String variantId) {
        return warehouseStockRepository
                .findByWarehouseIdAndVariantId(warehouseId, variantId)
                .orElseGet(() -> {
                    Warehouse warehouse = warehouseRepository.findById(warehouseId)
                            .orElseThrow(() -> new AppException(ErrorCode.ENTITY_NOT_FOUND, "Warehouse not found"));
                    ProductVariant variant = productVariantRepository.findById(variantId)
                            .orElseThrow(() -> new AppException(ErrorCode.ENTITY_NOT_FOUND, "Product variant not found"));

                    WarehouseStock newStock = WarehouseStock.builder()
                            .warehouse(warehouse)
                            .productVariant(variant)
                            .stockQuantity(0L)
                            .reservedQuantity(0L)
                            .build();
                    return warehouseStockRepository.save(newStock);
                });
    }

    private void updateVariantTotalStock(String variantId) {
        Long totalStock = warehouseStockRepository.getTotalAvailableStockForVariant(variantId);
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElse(null);
        if (variant != null) {
            variant.setStock(totalStock);
            productVariantRepository.save(variant);
        }
    }
}
