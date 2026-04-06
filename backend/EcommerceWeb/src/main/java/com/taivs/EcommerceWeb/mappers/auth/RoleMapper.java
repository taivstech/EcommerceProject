package com.taivs.EcommerceWeb.mappers.auth;

import com.taivs.EcommerceWeb.dto.request.auth.RoleRequest;
import com.taivs.EcommerceWeb.dto.response.auth.RoleResponse;
import com.taivs.EcommerceWeb.models.auth.Role;
import org.mapstruct.Mapper;

@Mapper(
        componentModel = "spring",
        uses = { PermissionMapper.class}
)
public interface RoleMapper {

    Role toRole(RoleRequest request);

    RoleResponse toRoleResponse(Role role);
}
