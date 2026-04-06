package com.taivs.EcommerceWeb.services.auth;

import com.taivs.EcommerceWeb.dto.request.auth.RoleRequest;
import com.taivs.EcommerceWeb.dto.response.auth.RoleResponse;

import java.util.List;

public interface RoleService {

    RoleResponse create(RoleRequest request);

    List<RoleResponse> getAll();

    void deleteByName(String roleName);
}
