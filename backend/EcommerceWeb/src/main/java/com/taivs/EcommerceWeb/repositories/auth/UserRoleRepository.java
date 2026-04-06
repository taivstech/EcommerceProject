package com.taivs.EcommerceWeb.repositories.auth;

import com.taivs.EcommerceWeb.models.auth.UserRole;
import com.taivs.EcommerceWeb.models.auth.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Set;

public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {
    Set<UserRole> findByUserId(String id);
}
