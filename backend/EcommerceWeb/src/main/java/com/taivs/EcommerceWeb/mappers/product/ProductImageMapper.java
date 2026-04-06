package com.taivs.EcommerceWeb.mappers.product;

import com.taivs.EcommerceWeb.dto.response.product.ProductImageResponse;
import com.taivs.EcommerceWeb.models.product.ProductImage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProductImageMapper {
    @Mapping(target = "isMain", source = "isMain")
    ProductImageResponse toResponse(ProductImage entity);
}

