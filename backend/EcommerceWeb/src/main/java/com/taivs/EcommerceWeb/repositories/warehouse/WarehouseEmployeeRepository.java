package com.taivs.EcommerceWeb.repositories.warehouse;

import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.models.warehouse.WarehouseEmployee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface WarehouseEmployeeRepository extends JpaRepository<WarehouseEmployee, String> {

    Set<WarehouseEmployee> findByWarehouse_Id(String warehouseId);

    Optional<WarehouseEmployee> findByWarehouse_IdAndUser_Id(String warehouseId, String userId);

    boolean existsByWarehouse_IdAndUser_Id(String warehouseId, String userId);

    @Query("SELECT COUNT(we) FROM WarehouseEmployee we WHERE we.user.id = :userId AND we.warehouse.shop.id = :shopId")
    long countByUserIdAndShopId(@Param("userId") String userId, @Param("shopId") String shopId);
}
