package com.taivs.EcommerceWeb.repositories.user;

import com.taivs.EcommerceWeb.models.user.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAddressRepository extends JpaRepository<UserAddress, String> {
    List<UserAddress> findAllByUser_Id(String userId);
    
    Optional<UserAddress> findByUser_IdAndDefaultAddressTrue(String userId);
}

