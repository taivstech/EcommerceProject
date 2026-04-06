package com.taivs.EcommerceWeb.mappers.user;

import com.taivs.EcommerceWeb.dto.request.user.UserAddressRequest;
import com.taivs.EcommerceWeb.dto.response.user.UserAddressResponse;
import com.taivs.EcommerceWeb.models.user.UserAddress;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserAddressMapper {
    UserAddress toEntity(UserAddressRequest request);

    UserAddressResponse toResponse(UserAddress entity);

    void update(@MappingTarget UserAddress entity, UserAddressRequest request);
}

