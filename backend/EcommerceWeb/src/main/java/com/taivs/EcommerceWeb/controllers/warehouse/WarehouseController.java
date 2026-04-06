package com.taivs.EcommerceWeb.controllers.warehouse;

import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.dto.response.user.UserResponse;
import com.taivs.EcommerceWeb.dto.warehouse.InventorySummaryDto;
import com.taivs.EcommerceWeb.dto.warehouse.ProductAgingDto;
import com.taivs.EcommerceWeb.dto.warehouse.RecentSaleDto;
import com.taivs.EcommerceWeb.dto.warehouse.StockAlertDto;
import com.taivs.EcommerceWeb.dto.request.warehouse.AssignEmployeeRequest;
import com.taivs.EcommerceWeb.dto.request.warehouse.CreateWarehouseEmployeeRequest;
import com.taivs.EcommerceWeb.dto.request.warehouse.WarehouseCreateRequest;
import com.taivs.EcommerceWeb.dto.request.warehouse.WarehouseUpdateRequest;
import com.taivs.EcommerceWeb.dto.response.warehouse.WarehouseResponse;
import com.taivs.EcommerceWeb.services.warehouse.InventoryService;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;
    private final InventoryService inventoryService;

    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    public ApiResponse<WarehouseResponse> create(@Valid @RequestBody WarehouseCreateRequest request) {
        return ApiResponse.<WarehouseResponse>builder()
                .result(warehouseService.create(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ApiResponse<WarehouseResponse> update(@PathVariable String id,
                                                  @RequestBody WarehouseUpdateRequest request) {
        return ApiResponse.<WarehouseResponse>builder()
                .result(warehouseService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ApiResponse<Void> delete(@PathVariable String id) {
        warehouseService.delete(id);
        return ApiResponse.<Void>builder()
                .message("Warehouse deleted")
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SELLER', 'WAREHOUSE_EMPLOYEE')")
    public ApiResponse<WarehouseResponse> getById(@PathVariable String id) {
        return ApiResponse.<WarehouseResponse>builder()
                .result(warehouseService.getById(id))
                .build();
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('SELLER')")
    public ApiResponse<List<WarehouseResponse>> getMyWarehouses() {
        return ApiResponse.<List<WarehouseResponse>>builder()
                .result(warehouseService.getMyWarehouses())
                .build();
    }

    @PostMapping("/{id}/employees/create")
    @PreAuthorize("hasRole('SELLER')")
    public ApiResponse<UserResponse> createWarehouseEmployee(@PathVariable String id,
                                                              @Valid @RequestBody CreateWarehouseEmployeeRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(warehouseService.createWarehouseEmployee(id, request))
                .message("Warehouse employee account created and assigned")
                .build();
    }

    @PostMapping("/{id}/employees")
    @PreAuthorize("hasRole('SELLER')")
    public ApiResponse<Void> assignEmployee(@PathVariable String id,
                                             @Valid @RequestBody AssignEmployeeRequest request) {
        warehouseService.assignEmployee(id, request);
        return ApiResponse.<Void>builder()
                .message("Employee assigned to warehouse")
                .build();
    }

    @DeleteMapping("/{warehouseId}/employees/{userId}")
    @PreAuthorize("hasRole('SELLER')")
    public ApiResponse<Void> removeEmployee(@PathVariable String warehouseId,
                                             @PathVariable String userId) {
        warehouseService.removeEmployee(warehouseId, userId);
        return ApiResponse.<Void>builder()
                .message("Employee removed from warehouse")
                .build();
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasRole('WAREHOUSE_EMPLOYEE')")
    public ApiResponse<List<WarehouseResponse>> getMyAssignedWarehouses() {
        return ApiResponse.<List<WarehouseResponse>>builder()
                .result(warehouseService.getMyAssignedWarehouses())
                .build();
    }

    @GetMapping("/shop/{shopId}")
    public ApiResponse<List<WarehouseResponse>> getShopWarehouses(@PathVariable String shopId) {
        return ApiResponse.<List<WarehouseResponse>>builder()
                .result(warehouseService.getShopWarehouses(shopId))
                .build();
    }


    @GetMapping("/inventory/summary")
    @PreAuthorize("hasAnyRole('SELLER', 'WAREHOUSE_EMPLOYEE')")
    public ApiResponse<InventorySummaryDto> getInventorySummary() {
        return ApiResponse.<InventorySummaryDto>builder()
                .result(inventoryService.getInventorySummary())
                .build();
    }

    @GetMapping("/inventory/stock-alerts")
    @PreAuthorize("hasAnyRole('SELLER', 'WAREHOUSE_EMPLOYEE')")
    public ApiResponse<List<StockAlertDto>> getStockAlerts(
            @RequestParam(defaultValue = "20") int threshold) {
        return ApiResponse.<List<StockAlertDto>>builder()
                .result(inventoryService.getStockAlerts(threshold))
                .build();
    }

    @GetMapping("/inventory/product-aging")
    @PreAuthorize("hasAnyRole('SELLER', 'WAREHOUSE_EMPLOYEE')")
    public ApiResponse<List<ProductAgingDto>> getProductAging() {
        return ApiResponse.<List<ProductAgingDto>>builder()
                .result(inventoryService.getProductAging())
                .build();
    }

    @GetMapping("/inventory/recent-sales")
    @PreAuthorize("hasAnyRole('SELLER', 'WAREHOUSE_EMPLOYEE')")
    public ApiResponse<List<RecentSaleDto>> getRecentSales(
            @RequestParam(defaultValue = "50") int limit) {
        return ApiResponse.<List<RecentSaleDto>>builder()
                .result(inventoryService.getRecentSales(limit))
                .build();
    }
}
