package com.taivs.EcommerceWeb.repositories.auth;

import com.taivs.EcommerceWeb.models.auth.Permission;
import com.taivs.EcommerceWeb.models.auth.Role;
import com.taivs.EcommerceWeb.models.auth.RolePermission;
import com.taivs.EcommerceWeb.models.auth.RolePermissionId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RolePermissionRepository extends JpaRepository<RolePermission, RolePermissionId> {
    Optional<RolePermission> findByRoleAndPermission(Role role, Permission permission);
}
