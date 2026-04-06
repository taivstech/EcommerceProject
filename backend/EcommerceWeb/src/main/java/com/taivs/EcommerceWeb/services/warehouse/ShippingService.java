package com.taivs.EcommerceWeb.services.warehouse;

import com.taivs.EcommerceWeb.models.product.ProductVariant;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface ShippingService {

    BigDecimal calculateShippingFee(BigDecimal totalWeight, String provinceId, String shipment);

    BigDecimal calculateTotalWeight(List<ProductVariant> variants, Map<String, Integer> qtyByVariant);
}
