package com.taivs.EcommerceWeb.repositories.auth;

import com.taivs.EcommerceWeb.models.auth.UserIdentity;
import com.taivs.EcommerceWeb.enums.auth.AuthProviderType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserIdentityRepository extends JpaRepository<UserIdentity,String> {
    Optional<UserIdentity> findByProviderAndProviderUserId(AuthProviderType providerType, String providerUserId);
}
