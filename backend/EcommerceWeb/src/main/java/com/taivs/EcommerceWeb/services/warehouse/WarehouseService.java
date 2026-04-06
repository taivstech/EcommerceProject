package com.taivs.EcommerceWeb.services.warehouse;

import com.taivs.EcommerceWeb.dto.response.user.UserResponse;
import com.taivs.EcommerceWeb.dto.request.warehouse.AssignEmployeeRequest;
import com.taivs.EcommerceWeb.dto.request.warehouse.CreateWarehouseEmployeeRequest;
import com.taivs.EcommerceWeb.dto.request.warehouse.WarehouseCreateRequest;
import com.taivs.EcommerceWeb.dto.request.warehouse.WarehouseUpdateRequest;
import com.taivs.EcommerceWeb.dto.response.warehouse.WarehouseResponse;

import java.util.List;

public interface WarehouseService {

    WarehouseResponse create(WarehouseCreateRequest request);

    WarehouseResponse update(String warehouseId, WarehouseUpdateRequest request);

    void delete(String warehouseId);

    WarehouseResponse getById(String warehouseId);

    List<WarehouseResponse> getMyWarehouses();

    void assignEmployee(String warehouseId, AssignEmployeeRequest request);

    UserResponse createWarehouseEmployee(String warehouseId, CreateWarehouseEmployeeRequest request);

    void removeEmployee(String warehouseId, String userId);

    List<WarehouseResponse> getMyAssignedWarehouses();

    List<WarehouseResponse> getShopWarehouses(String shopId);
}
