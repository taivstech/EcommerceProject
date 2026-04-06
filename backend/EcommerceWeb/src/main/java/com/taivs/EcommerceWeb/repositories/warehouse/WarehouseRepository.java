package com.taivs.EcommerceWeb.repositories.warehouse;

import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WarehouseRepository extends JpaRepository<Warehouse, String> {

    @Query("""
        SELECT w FROM Warehouse w
        LEFT JOIN FETCH w.shop
        LEFT JOIN FETCH w.employees e
        LEFT JOIN FETCH e.user
        WHERE w.shop.id = :shopId
        AND w.deletedAt IS NULL
        ORDER BY w.isDefault DESC, w.createdAt ASC
    """)
    List<Warehouse> findByShopIdWithEmployees(@Param("shopId") String shopId);

    @Query("""
        SELECT w FROM Warehouse w
        LEFT JOIN FETCH w.shop
        WHERE w.shop.id = :shopId
        AND w.status = 'ACTIVE'
        AND w.deletedAt IS NULL
    """)
    List<Warehouse> findActiveByShopId(@Param("shopId") String shopId);

    @Query("""
        SELECT w FROM Warehouse w
        LEFT JOIN FETCH w.shop
        LEFT JOIN FETCH w.employees e
        LEFT JOIN FETCH e.user
        WHERE w.id = :id
        AND w.deletedAt IS NULL
    """)
    Optional<Warehouse> findByIdWithEmployees(@Param("id") String id);

    @Query("""
        SELECT w FROM Warehouse w
        LEFT JOIN FETCH w.shop
        LEFT JOIN FETCH w.employees e
        LEFT JOIN FETCH e.user
        WHERE e.user.id = :userId
        AND w.deletedAt IS NULL
    """)
    List<Warehouse> findByEmployeeUserId(@Param("userId") String userId);

    @Query("SELECT COUNT(w) FROM Warehouse w WHERE w.shop.id = :shopId AND w.deletedAt IS NULL")
    long countByShopId(@Param("shopId") String shopId);

    @Query("""
        SELECT w FROM Warehouse w
        LEFT JOIN FETCH w.shop
        WHERE w.shop.id = :shopId
        AND w.isDefault = true
        AND w.deletedAt IS NULL
    """)
    Optional<Warehouse> findDefaultByShopId(@Param("shopId") String shopId);
}
