package com.taivs.EcommerceWeb.mappers.auth;

import com.taivs.EcommerceWeb.dto.response.auth.PermissionResponse;
import com.taivs.EcommerceWeb.models.auth.Permission;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    PermissionResponse toPermissionResponse(Permission permission);
}

