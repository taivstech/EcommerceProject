package com.taivs.EcommerceWeb.controllers.order;

import com.taivs.EcommerceWeb.services.order.ExportService;
import com.taivs.EcommerceWeb.dto.request.order.UpdateOrderStatusRequest;
import com.taivs.EcommerceWeb.dto.response.order.OrderResponse;
import com.taivs.EcommerceWeb.services.order.AdminOrderService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {
    private final AdminOrderService adminOrderService;
    private final ExportService exportService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<OrderResponse>> getAllOrders(
            @RequestParam(required = false) String status) {
        return ApiResponse.<List<OrderResponse>>builder()
                .result(adminOrderService.getAllOrders(status))
                .build();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> updateOrderStatus(@PathVariable("id") String id,
            @RequestBody @Valid UpdateOrderStatusRequest request) {
        adminOrderService.adminUpdateOrderStatus(id, request.getStatus());
        return ApiResponse.<Void>builder().build();
    }

    @PutMapping("/{id}/deliver")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deliverOrder(@PathVariable("id") String id) {
        adminOrderService.deliverOrder(id);
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportOrders(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        byte[] data = exportService.exportOrdersExcel(from, to);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=orders-report.xlsx")
                .contentType(
                        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }
}
