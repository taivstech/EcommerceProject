package com.taivs.EcommerceWeb.mappers.product;

import com.taivs.EcommerceWeb.dto.response.product.DetailAttributeResponse;
import com.taivs.EcommerceWeb.dto.response.product.ProductImageResponse;
import com.taivs.EcommerceWeb.dto.response.product.ProductVariantResponse;
import com.taivs.EcommerceWeb.models.product.DetailAttribute;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.models.product.ProductVariantImage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface ProductVariantMapper {

    @Mapping(target = "detailAttributes", expression = "java(toDetailAttributeResponses(entity))")
    @Mapping(target = "images", expression = "java(toImageResponses(entity))")
    @Mapping(target = "imageUrl", expression = "java(entity.getMainImageUrl())")
    ProductVariantResponse toResponse(ProductVariant entity);

    default List<DetailAttributeResponse> toDetailAttributeResponses(ProductVariant entity) {
        if (entity == null || entity.getDetailAttributes() == null) return Collections.emptyList();
        return entity.getDetailAttributes().stream()
                .map(da -> DetailAttributeResponse.builder()
                        .id(da.getId())
                        .name(da.getName())
                        .imageUrl(da.getImageUrl())
                        .sortOrder(da.getSortOrder())
                        .build())
                .collect(Collectors.toList());
    }

    default List<ProductImageResponse> toImageResponses(ProductVariant entity) {
        if (entity == null || entity.getImages() == null) return Collections.emptyList();
        return entity.getImages().stream()
                .map(img -> ProductImageResponse.builder()
                        .id(img.getId())
                        .url(img.getUrl())
                        .isMain(img.getIsMain())
                        .build())
                .collect(Collectors.toList());
    }
}
