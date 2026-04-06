package com.taivs.EcommerceWeb.services.shop;

import com.taivs.EcommerceWeb.dto.response.shop.ShopAddressResponse;

import java.util.List;

public interface ShopAddressService {

    List<ShopAddressResponse> getAll(List<String> shopIds);
}
