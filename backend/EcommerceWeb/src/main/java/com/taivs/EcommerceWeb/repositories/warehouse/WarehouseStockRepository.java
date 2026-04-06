package com.taivs.EcommerceWeb.repositories.warehouse;

import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.models.warehouse.WarehouseStock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WarehouseStockRepository extends JpaRepository<WarehouseStock, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT ws FROM WarehouseStock ws
        WHERE ws.warehouse.id = :warehouseId
        AND ws.productVariant.id = :variantId
        AND ws.deletedAt IS NULL
    """)
    Optional<WarehouseStock> findByWarehouseIdAndVariantId(
            @Param("warehouseId") String warehouseId,
            @Param("variantId") String variantId
    );

    @Query("""
        SELECT ws FROM WarehouseStock ws
        WHERE ws.productVariant.id = :variantId
        AND ws.deletedAt IS NULL
        ORDER BY ws.warehouse.isDefault DESC, (ws.stockQuantity - ws.reservedQuantity) DESC
    """)
    List<WarehouseStock> findByVariantId(@Param("variantId") String variantId);

    @Query("""
        SELECT ws FROM WarehouseStock ws
        WHERE ws.warehouse.id = :warehouseId
        AND ws.deletedAt IS NULL
        ORDER BY ws.productVariant.product.name ASC
    """)
    List<WarehouseStock> findByWarehouseId(@Param("warehouseId") String warehouseId);

    @Query("""
        SELECT ws FROM WarehouseStock ws
        WHERE ws.warehouse.id = :warehouseId
        AND ws.productVariant.id IN :variantIds
        AND ws.deletedAt IS NULL
    """)
    List<WarehouseStock> findByWarehouseIdAndVariantIds(
            @Param("warehouseId") String warehouseId,
            @Param("variantIds") List<String> variantIds
    );

    @Query("""
        SELECT ws FROM WarehouseStock ws
        WHERE ws.productVariant.id = :variantId
        AND ws.warehouse.status = 'ACTIVE'
        AND ws.warehouse.deletedAt IS NULL
        AND ws.deletedAt IS NULL
        AND (ws.stockQuantity - ws.reservedQuantity) > 0
        ORDER BY (ws.stockQuantity - ws.reservedQuantity) DESC
    """)
    List<WarehouseStock> findAvailableStockForVariant(@Param("variantId") String variantId);

    @Query("""
        SELECT COALESCE(SUM(ws.stockQuantity - ws.reservedQuantity), 0) FROM WarehouseStock ws
        WHERE ws.productVariant.id = :variantId
        AND ws.deletedAt IS NULL
    """)
    Long getTotalAvailableStockForVariant(@Param("variantId") String variantId);
}
