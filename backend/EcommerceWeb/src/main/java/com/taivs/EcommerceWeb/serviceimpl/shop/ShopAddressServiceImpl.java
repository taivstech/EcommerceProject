package com.taivs.EcommerceWeb.serviceimpl.shop;

import com.taivs.EcommerceWeb.dto.response.shop.ShopAddressResponse;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.shop.ShopAddress;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.repositories.shop.ShopRepository;
import com.taivs.EcommerceWeb.repositories.warehouse.WarehouseRepository;
import com.taivs.EcommerceWeb.services.shop.ShopAddressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShopAddressServiceImpl implements ShopAddressService {
    private final ShopRepository shopRepository;
    private final WarehouseRepository warehouseRepository;

    @Override
    public List<ShopAddressResponse> getAll(List<String> shopIds) {
        return shopRepository.findAllById(shopIds).stream()
                .map(this::toShopAddressResponse)
                .collect(Collectors.toList());
    }

    private ShopAddressResponse toShopAddressResponse(Shop shop) {
        ShopAddress addr = shop.getShopAddress();
        if (addr == null || addr.getDistrictId() == null) {
            // Fall back to default or active warehouse address for this shop
            Optional<Warehouse> defaultWh = warehouseRepository.findDefaultByShopId(shop.getId())
                    .or(() -> warehouseRepository.findActiveByShopId(shop.getId()).stream().findFirst());
            if (defaultWh.isPresent()) {
                Warehouse wh = defaultWh.get();
                log.info("Shop {} has no configured address or district ID. Falling back to warehouse address: {}", shop.getId(), wh.getName());
                return ShopAddressResponse.builder()
                        .id(shop.getId())
                        .phoneNumber(wh.getContactPhone())
                        .latitude(wh.getLatitude())
                        .longitude(wh.getLongitude())
                        .fullAddress(wh.getFullAddress())
                        .detailAddress(wh.getDetailAddress())
                        .ward(wh.getWard())
                        .wardCode(wh.getWardCode())
                        .district(wh.getDistrict())
                        .districtId(wh.getDistrictId())
                        .province(wh.getProvince())
                        .provinceId(wh.getProvinceId())
                        .build();
            }

            if (addr == null) {
                return ShopAddressResponse.builder()
                        .id(shop.getId())
                        .build();
            }
        }

        return ShopAddressResponse.builder()
                .id(shop.getId())
                .phoneNumber(addr.getPhoneNumber())
                .latitude(addr.getLatitude())
                .longitude(addr.getLongitude())
                .fullAddress(addr.getFullAddress())
                .detailAddress(addr.getDetailAddress())
                .ward(addr.getWard())
                .wardCode(addr.getWardCode())
                .district(addr.getDistrict())
                .districtId(addr.getDistrictId())
                .province(addr.getProvince())
                .provinceId(addr.getProvinceId())
                .build();
    }
}
// xung dot giua 2 api ngoai neu nhu khon sua duoc code