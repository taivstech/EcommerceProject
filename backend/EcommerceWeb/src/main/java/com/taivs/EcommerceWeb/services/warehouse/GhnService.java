package com.taivs.EcommerceWeb.services.warehouse;

import com.taivs.EcommerceWeb.dto.request.warehouse.ShippingFeeRequest;

import java.util.Map;

public interface GhnService {

    String getProvinces();

    String getDistricts(int provinceId);

    String getWards(int districtId);

    Map<String, Object> getAvailableService(Integer fromDistrictId, Integer toDistrictId);

    Map<String, Object> calculateFee(ShippingFeeRequest request);

    Map<String, Object> calculateFeeWithShopId(ShippingFeeRequest request, int ghnShopId);

    Map<String, Object> registerShop(String name, String phone, String address,
                                      int districtId, String wardCode);
}
