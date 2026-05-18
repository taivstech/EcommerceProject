package com.taivs.EcommerceWeb.serviceimpl.warehouse;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.dto.request.order.CheckoutRequest;
import com.taivs.EcommerceWeb.dto.request.warehouse.ShippingFeeRequest;
import com.taivs.EcommerceWeb.services.warehouse.GhnService;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseSelectionService;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.repositories.warehouse.WarehouseRepository;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseStockService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class WarehouseSelectionServiceImpl implements WarehouseSelectionService {

    private final WarehouseRepository warehouseRepository;
    private final WarehouseStockService warehouseStockService;
    private final GhnService ghnService;

    @Override
    public List<WarehouseSelectionResult> selectWarehouses(
            String shopId,
            Map<String, Long> items,
            CheckoutRequest request,
            BigDecimal totalWeight
    ) {
        List<Warehouse> warehouses = warehouseRepository.findActiveByShopId(shopId);
        
        if (warehouses.isEmpty()) {
            log.warn("No active warehouses found for shop {}", shopId);
            return Collections.emptyList();
        }

        if (!hasTotalSufficientStock(shopId, items)) {
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK, "Insufficient stock across all warehouses");
        }

        List<WarehouseCandidate> candidates = warehouses.stream()
                .map(wh -> {
                    BigDecimal shippingFee = calculateShippingFee(wh, request, totalWeight);
                    Map<String, Boolean> stockAvailability = warehouseStockService.checkStockAvailability(
                            wh.getId(), items);
                    boolean canFulfillAll = stockAvailability.values().stream().allMatch(Boolean::booleanValue);
                    
                    return new WarehouseCandidate(wh, shippingFee, stockAvailability, canFulfillAll);
                })
                .filter(c -> c.shippingFee != null)
                .sorted(Comparator.comparing((WarehouseCandidate c) -> c.shippingFee)
                        .thenComparing(c -> !c.canFulfillAll))
                .collect(Collectors.toList());

        if (candidates.isEmpty()) {
            log.warn("No warehouses with valid shipping fees for shop {}", shopId);
            return Collections.emptyList();
        }

        for (WarehouseCandidate candidate : candidates) {
            if (candidate.canFulfillAll) {
                log.info("Selected single warehouse {} for shop {} (fee: {} VND)",
                        candidate.warehouse.getName(), shopId, candidate.shippingFee);
                return Collections.singletonList(new WarehouseSelectionResult(
                        candidate.warehouse,
                        candidate.shippingFee,
                        items,
                        false
                ));
            }
        }

        log.info("No single warehouse can fulfill all items for shop {}, splitting order...", shopId);
        return splitOrderAcrossWarehouses(candidates, items, request, totalWeight);
    }

    @Override
    public boolean hasTotalSufficientStock(String shopId, Map<String, Long> items) {
        for (Map.Entry<String, Long> entry : items.entrySet()) {
            String variantId = entry.getKey();
            Long requiredQuantity = entry.getValue();
            Long totalAvailable = warehouseStockService.getTotalAvailableStock(variantId);
            
            if (totalAvailable < requiredQuantity) {
                log.warn("Insufficient total stock for variant {}: required {}, available {}",
                        variantId, requiredQuantity, totalAvailable);
                return false;
            }
        }
        return true;
    }

    private List<WarehouseSelectionResult> splitOrderAcrossWarehouses(
            List<WarehouseCandidate> candidates,
            Map<String, Long> items,
            CheckoutRequest request,
            BigDecimal totalWeight
    ) {
        List<WarehouseSelectionResult> results = new ArrayList<>();
        Map<String, Long> remainingQuantities = new HashMap<>(items);

        for (WarehouseCandidate candidate : candidates) {
            if (remainingQuantities.values().stream().allMatch(qty -> qty <= 0)) {
                break;
            }

            Map<String, Long> fulfillFromThis = new HashMap<>();
            Map<String, Boolean> stockAvailability = candidate.stockAvailability;

            for (Map.Entry<String, Long> entry : remainingQuantities.entrySet()) {
                String variantId = entry.getKey();
                Long remaining = entry.getValue();
                
                if (remaining > 0 && Boolean.TRUE.equals(stockAvailability.get(variantId))) {
                    Long available = warehouseStockService.getAvailableStock(
                            candidate.warehouse.getId(), variantId);
                    Long fulfillQty = Math.min(remaining, available);
                    
                    if (fulfillQty > 0) {
                        fulfillFromThis.put(variantId, fulfillQty);
                        remainingQuantities.put(variantId, remaining - fulfillQty);
                    }
                }
            }

            if (!fulfillFromThis.isEmpty()) {
                BigDecimal partialWeight = calculatePartialWeight(fulfillFromThis, totalWeight, items);
                BigDecimal partialShippingFee = calculateShippingFee(
                        candidate.warehouse, request, partialWeight);
                
                results.add(new WarehouseSelectionResult(
                        candidate.warehouse,
                        partialShippingFee != null ? partialShippingFee : candidate.shippingFee,
                        fulfillFromThis,
                        true
                ));
                
                log.info("Split order: {} items from warehouse {} (fee: {} VND)",
                        fulfillFromThis.size(), candidate.warehouse.getName(),
                        partialShippingFee != null ? partialShippingFee : candidate.shippingFee);
            }
        }
        boolean allFulfilled = remainingQuantities.values().stream().allMatch(qty -> qty <= 0);
        if (!allFulfilled) {
            log.error("Failed to fulfill all items. Remaining: {}", remainingQuantities);
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK, "Failed to fulfill all items across warehouses");
        }

        return results;
    }

    private BigDecimal calculateShippingFee(Warehouse warehouse, CheckoutRequest request, BigDecimal weight) {
        Integer toDistrictId = request.getDistrictId();
        String toWardCode = request.getWardCode();

        if (warehouse.getDistrictId() == null || toDistrictId == null
                || toWardCode == null || toWardCode.isBlank()) {
            return null;
        }

        if (warehouse.getDistrictId() < 1000) {
            log.warn("Warehouse {} district_id {} is invalid for GHN", warehouse.getId(), warehouse.getDistrictId());
            return null;
        }

        int weightGrams = weight != null
                ? weight.multiply(BigDecimal.valueOf(1000)).setScale(0, RoundingMode.UP).intValue()
                : 300;
        weightGrams = Math.max(1, weightGrams);

        ShippingFeeRequest feeRequest = ShippingFeeRequest.builder()
                .serviceTypeId(2)
                .fromDistrictId(warehouse.getDistrictId())
                .fromWardCode(warehouse.getWardCode() != null ? warehouse.getWardCode() : "")
                .toDistrictId(toDistrictId)
                .toWardCode(toWardCode)
                .weight(weightGrams)
                .length(30).width(40).height(20)
                .insuranceValue(0)
                .build();

        try {
            Map<String, Object> response;
            if (warehouse.getGhnShopId() != null) {
                response = ghnService.calculateFeeWithShopId(feeRequest, warehouse.getGhnShopId());
            } else {
                response = ghnService.calculateFee(feeRequest);
            }
            return extractFeeFromResponse(response);
        } catch (Exception e) {
            log.warn("Failed to calculate shipping fee from warehouse {}: {}", warehouse.getId(), e.getMessage());
            return null;
        }
    }

    private BigDecimal calculatePartialWeight(
            Map<String, Long> partialItems,
            BigDecimal totalWeight,
            Map<String, Long> allItems
    ) {
        if (totalWeight == null || totalWeight.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.valueOf(0.3);
        }

        long totalQty = allItems.values().stream().mapToLong(Long::longValue).sum();
        long partialQty = partialItems.values().stream().mapToLong(Long::longValue).sum();
        
        if (totalQty == 0) {
            return BigDecimal.valueOf(0.3);
        }

        BigDecimal ratio = BigDecimal.valueOf(partialQty)
                .divide(BigDecimal.valueOf(totalQty), 4, RoundingMode.HALF_UP);
        return totalWeight.multiply(ratio).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal extractFeeFromResponse(Map<String, Object> response) {
        if (response == null || !response.containsKey("data")) {
            return null;
        }

        Object data = response.get("data");
        if (data instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> dataMap = (Map<String, Object>) data;
            Object total = dataMap.get("total");
            if (total instanceof Number) {
                return BigDecimal.valueOf(((Number) total).doubleValue());
            }
        }
        return null;
    }

    private static class WarehouseCandidate {
        final Warehouse warehouse;
        final BigDecimal shippingFee;
        final Map<String, Boolean> stockAvailability;
        final boolean canFulfillAll;

        WarehouseCandidate(Warehouse warehouse, BigDecimal shippingFee,
                          Map<String, Boolean> stockAvailability, boolean canFulfillAll) {
            this.warehouse = warehouse;
            this.shippingFee = shippingFee;
            this.stockAvailability = stockAvailability;
            this.canFulfillAll = canFulfillAll;
        }
    }
}
