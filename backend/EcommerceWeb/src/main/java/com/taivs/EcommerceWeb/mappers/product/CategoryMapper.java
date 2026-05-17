package com.taivs.EcommerceWeb.mappers.product;

import com.taivs.EcommerceWeb.dto.request.product.CategoryRequest;
import com.taivs.EcommerceWeb.dto.response.product.CategoryResponse;
import com.taivs.EcommerceWeb.models.product.Category;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "products", ignore = true)
    Category toEntity(CategoryRequest request);

    CategoryResponse toResponse(Category entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "products", ignore = true)
    void update(@MappingTarget Category entity, CategoryRequest request);
}
