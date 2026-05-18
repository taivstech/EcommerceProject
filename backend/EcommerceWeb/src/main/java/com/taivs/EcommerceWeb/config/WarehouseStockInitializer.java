package com.taivs.EcommerceWeb.config;

import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.shop.ShopAddress;
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
                            
                    if (defaultWarehouse == null) {
                        log.info("Creating default warehouse for shop: {} ({})", shop.getName(), shop.getId());
                        
                        String whName = "Kho mac dinh " + shop.getName();
                        if (whName.length() > 100) whName = whName.substring(0, 100);
                        
                        String whContactName = "Chu Shop " + shop.getName();
                        if (whContactName.length() > 100) whContactName = whContactName.substring(0, 100);

                        String whContactPhone = "0999999999";
                        String whFullAddress = "Ha Noi, Viet Nam";
                        String whDetailAddress = "Ha Noi, Viet Nam";
                        String whProvince = "Ha Noi";
                        String whProvinceId = "201";
                        String whDistrict = "Quan Ba Dinh";
                        Integer whDistrictId = 1482;
                        String whWard = "Phuong Cong Vi";
                        String whWardCode = "1A0807";
                        
                        if (shop.getShopAddress() != null) {
                            var sa = shop.getShopAddress();
                            if (sa.getPhoneNumber() != null) whContactPhone = sa.getPhoneNumber();
                            if (sa.getFullAddress() != null) whFullAddress = sa.getFullAddress();
                            if (sa.getDetailAddress() != null) whDetailAddress = sa.getDetailAddress();
                            if (sa.getProvince() != null) whProvince = sa.getProvince();
                            if (sa.getProvinceId() != null) whProvinceId = sa.getProvinceId();
                            if (sa.getDistrict() != null) whDistrict = sa.getDistrict();
                            if (sa.getDistrictId() != null) whDistrictId = sa.getDistrictId();
                            if (sa.getWard() != null) whWard = sa.getWard();
                            if (sa.getWardCode() != null) whWardCode = sa.getWardCode();
                        } else if (shop.getAddress() != null && !shop.getAddress().trim().isEmpty()) {
                            whFullAddress = shop.getAddress();
                            whDetailAddress = shop.getAddress();
                        }
                        
                        defaultWarehouse = Warehouse.builder()
                                .name(whName)
                                .contactName(whContactName)
                                .contactPhone(whContactPhone)
                                .fullAddress(whFullAddress)
                                .detailAddress(whDetailAddress)
                                .province(whProvince)
                                .provinceId(whProvinceId)
                                .district(whDistrict)
                                .districtId(whDistrictId)
                                .ward(whWard)
                                .wardCode(whWardCode)
                                .status("ACTIVE")
                                .isDefault(true)
                                .shop(shop)
                                .build();
                        
                        defaultWarehouse = warehouseRepository.save(defaultWarehouse);
                    }
                    
                    warehouseStockService.updateStockQuantity(
                            defaultWarehouse.getId(),
                            v.getId(),
                            v.getStock()
                    );
                    successCount++;
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
