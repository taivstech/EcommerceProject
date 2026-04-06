package com.taivs.EcommerceWeb.mappers.product;

import com.taivs.EcommerceWeb.models.product.Category;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.dto.request.product.ProductCreateRequest;
import com.taivs.EcommerceWeb.dto.request.product.ProductUpdateRequest;
import com.taivs.EcommerceWeb.dto.response.product.DetailAttributeResponse;
import com.taivs.EcommerceWeb.dto.response.product.ProductAttributeResponse;
import com.taivs.EcommerceWeb.dto.response.product.ProductResponse;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.product.ProductAttribute;
import org.mapstruct.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(
        componentModel = "spring",
        uses = {ProductImageMapper.class, ProductVariantMapper.class},
        builder = @org.mapstruct.Builder(disableBuilder = true)
)
public interface ProductMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "shop", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "variants", ignore = true)
    @Mapping(target = "attributes", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Product toEntity(ProductCreateRequest request);

    @Mapping(target = "shopId", expression = "java(product.getShop() == null ? null : product.getShop().getId())")
    @Mapping(target = "shopName", expression = "java(product.getShop() == null ? null : product.getShop().getName())")
    @Mapping(target = "categoryId", expression = "java(product.getCategory() == null ? null : product.getCategory().getId())")
    @Mapping(target = "attributes", expression = "java(toAttributeResponses(product))")
    @Mapping(target = "totalSold", expression = "java(computeTotalSold(product))")
    ProductResponse toResponse(Product product);

    default Long computeTotalSold(Product product) {
        if (product == null || product.getVariants() == null) return 0L;
        return product.getVariants().stream()
                .mapToLong(v -> v.getSoldCount() == null ? 0L : v.getSoldCount())
                .sum();
    }

    default List<ProductAttributeResponse> toAttributeResponses(Product product) {
        if (product == null || product.getAttributes() == null) return Collections.emptyList();
        return product.getAttributes().stream()
                .map(attr -> ProductAttributeResponse.builder()
                        .id(attr.getId())
                        .name(attr.getName())
                        .sortOrder(attr.getSortOrder())
                        .options(attr.getDetailAttributes() == null ? Collections.emptyList()
                                : attr.getDetailAttributes().stream()
                                        .map(da -> DetailAttributeResponse.builder()
                                                .id(da.getId())
                                                .name(da.getName())
                                                .imageUrl(da.getImageUrl())
                                                .sortOrder(da.getSortOrder())
                                                .build())
                                        .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
    }
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "shop", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "variants", ignore = true)
    @Mapping(target = "attributes", ignore = true)
    @Mapping(target = "minPrice", ignore = true)
    @Mapping(target = "maxPrice", ignore = true)
    @Mapping(target = "totalSold", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    void updateEntity(@MappingTarget Product product, ProductUpdateRequest request);

}
