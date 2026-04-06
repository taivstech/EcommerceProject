package com.taivs.EcommerceWeb.controllers.order;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.dto.response.order.OrderResponse;
import com.taivs.EcommerceWeb.services.order.WarehouseEmployeeOrderService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/warehouse/orders")
@RequiredArgsConstructor
public class WarehouseEmployeeOrderController {

    private final WarehouseEmployeeOrderService warehouseEmployeeOrderService;

    @GetMapping
    public ApiResponse<List<OrderResponse>> getMyWarehouseOrders() {
        return ApiResponse.<List<OrderResponse>>builder()
                .result(warehouseEmployeeOrderService.getMyWarehouseOrders())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getWarehouseOrderById(@PathVariable String id) {
        return ApiResponse.<OrderResponse>builder()
                .result(warehouseEmployeeOrderService.getWarehouseOrderById(id))
                .build();
    }

    @PutMapping("/{id}/pack")
    public ApiResponse<Void> confirmPacking(@PathVariable String id) {
        warehouseEmployeeOrderService.confirmPacking(id);
        return ApiResponse.<Void>builder()
                .message("Order packing confirmed")
                .build();
    }

    @PutMapping("/{id}/ship")
    public ApiResponse<Void> markShipped(@PathVariable String id) {
        warehouseEmployeeOrderService.markShipped(id);
        return ApiResponse.<Void>builder()
                .message("Order marked as shipped")
                .build();
    }
}
