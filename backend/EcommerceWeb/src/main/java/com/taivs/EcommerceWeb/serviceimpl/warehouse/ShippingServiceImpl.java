package com.taivs.EcommerceWeb.serviceimpl.warehouse;

import com.taivs.EcommerceWeb.services.warehouse.ShippingService;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@Service
public class ShippingServiceImpl implements ShippingService {

    @Override
    public BigDecimal calculateShippingFee(BigDecimal totalWeight, String provinceId, String shipment) {
        BigDecimal baseFee = new BigDecimal("30000");

        BigDecimal weightFee = totalWeight != null
                ? totalWeight.multiply(new BigDecimal("5000"))
                : BigDecimal.ZERO;

        BigDecimal distanceFee = calculateDistanceFee(provinceId);

        BigDecimal shipmentMultiplier = switch (shipment != null ? shipment.toUpperCase() : "STANDARD") {
            case "EXPRESS" -> new BigDecimal("1.5");
            case "SAME_DAY" -> new BigDecimal("2.0");
            default -> BigDecimal.ONE;
        };

        BigDecimal totalFee = baseFee.add(weightFee).add(distanceFee);
        return totalFee.multiply(shipmentMultiplier).setScale(0, RoundingMode.UP);
    }

    private BigDecimal calculateDistanceFee(String provinceId) {
        if (provinceId == null) {
            return BigDecimal.ZERO;
        }

        return switch (provinceId) {
            case "79", "01" -> BigDecimal.ZERO;
            case "48", "92", "77" -> new BigDecimal("10000");
            default -> new BigDecimal("20000");
        };
    }

    @Override
    public BigDecimal calculateTotalWeight(List<ProductVariant> variants, Map<String, Integer> qtyByVariant) {
        BigDecimal totalWeight = BigDecimal.ZERO;
        for (ProductVariant variant : variants) {
            BigDecimal weight = variant.getWeight();
            if (weight == null) {
                Product product = variant.getProduct();
                if (product != null) {
                    weight = product.getWeight();
                }
            }
            
            if (weight != null) {
                int qty = qtyByVariant.getOrDefault(variant.getId(), 1);
                totalWeight = totalWeight.add(weight.multiply(BigDecimal.valueOf(qty)));
            }
        }
        return totalWeight;
    }
}
