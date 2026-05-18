package com.taivs.EcommerceWeb.config;

import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.repositories.product.ProductVariantRepository;
import com.taivs.EcommerceWeb.repositories.warehouse.WarehouseRepository;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseStockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class WarehouseStockInitializer implements ApplicationRunner {

    private final ProductVariantRepository productVariantRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseStockService warehouseStockService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("Initializing WarehouseStock for variants that do not have any stock records...");
        
        try {
            // Find all variants that do not have a WarehouseStock entry
            List<ProductVariant> unsyncedVariants = productVariantRepository.findAllWithProductAndShop().stream()
                    .filter(v -> {
                        // Return true if no WarehouseStock exists for this variant
                        return warehouseStockService.getTotalAvailableStock(v.getId()) <= 0 && 
                               (v.getStock() != null && v.getStock() > 0);
                    })
                    .toList();

            if (unsyncedVariants.isEmpty()) {
                log.info("All variants already have synchronized warehouse stock records.");
                return;
            }

            log.info("Found {} unsynced variants. Initializing warehouse stock...", unsyncedVariants.size());
            int successCount = 0;
            
            for (ProductVariant v : unsyncedVariants) {
                try {
                    Shop shop = v.getProduct().getShop();
                    if (shop == null) {
                        continue;
                    }
                    
                    Warehouse defaultWarehouse = warehouseRepository.findDefaultByShopId(shop.getId())
                            .or(() -> warehouseRepository.findActiveByShopId(shop.getId()).stream().findFirst())
                            .orElse(null);
                            
                    if (defaultWarehouse != null) {
                        warehouseStockService.updateStockQuantity(
                                defaultWarehouse.getId(),
                                v.getId(),
                                v.getStock()
                        );
                        successCount++;
                    } else {
                        log.warn("No active/default warehouse found for shop {} of product variant {}.", 
                                shop.getId(), v.getId());
                    }
                } catch (Exception e) {
                    log.error("Failed to initialize warehouse stock for variant {}: {}", v.getId(), e.getMessage());
                }
            }
            
            log.info("WarehouseStock initialization complete. Successfully synchronized {} variants.", successCount);
        } catch (Exception e) {
            log.error("Error during WarehouseStock initialization: {}", e.getMessage(), e);
        }
    }
}
