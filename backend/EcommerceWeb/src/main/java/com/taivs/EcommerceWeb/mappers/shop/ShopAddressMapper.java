package com.taivs.EcommerceWeb.mappers.shop;

import com.taivs.EcommerceWeb.dto.request.shop.ShopCreateRequest;
import com.taivs.EcommerceWeb.dto.request.shop.ShopUpdateRequest;
import com.taivs.EcommerceWeb.dto.response.shop.ShopAddressResponse;
import com.taivs.EcommerceWeb.models.shop.ShopAddress;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ShopAddressMapper {
    ShopAddress toShopAddress(ShopCreateRequest request);

    void update(@MappingTarget ShopAddress target, ShopUpdateRequest request);

    ShopAddressResponse toResponse(ShopAddress address);
}

