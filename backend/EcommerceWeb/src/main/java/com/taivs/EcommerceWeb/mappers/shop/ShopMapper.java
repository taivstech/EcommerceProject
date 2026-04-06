package com.taivs.EcommerceWeb.mappers.shop;

import com.taivs.EcommerceWeb.models.shop.ShopAddress;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.dto.request.shop.ShopCreateRequest;
import com.taivs.EcommerceWeb.dto.request.shop.ShopUpdateRequest;
import com.taivs.EcommerceWeb.dto.response.shop.ShopResponse;
import com.taivs.EcommerceWeb.models.shop.Shop;
import org.mapstruct.*;

@Mapper(
        componentModel = "spring",
        uses = {ShopAddressMapper.class},
        builder = @org.mapstruct.Builder(disableBuilder = true)
)
public interface ShopMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "shopAddress", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Shop toEntity(ShopCreateRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "shopAddress", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void update(@MappingTarget Shop shop, ShopUpdateRequest request);

    @Mapping(target = "userId", expression = "java(shop.getUser() == null ? null : shop.getUser().getId())")
    @Mapping(target = "approvedBy", expression = "java(shop.getApprovedBy() == null ? null : shop.getApprovedBy().getId())")
    @Mapping(target = "shopAddress", source = "shopAddress")
    ShopResponse toResponse(Shop shop);
}

