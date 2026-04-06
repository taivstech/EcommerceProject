package com.taivs.EcommerceWeb.repositories.auth;

import com.taivs.EcommerceWeb.models.auth.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission,String> {
    Optional<Permission> findByName(String permissionName);
}
