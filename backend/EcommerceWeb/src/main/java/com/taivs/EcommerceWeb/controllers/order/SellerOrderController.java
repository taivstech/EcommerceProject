package com.taivs.EcommerceWeb.controllers.order;

import com.taivs.EcommerceWeb.services.order.ExportService;
import com.taivs.EcommerceWeb.dto.response.order.OrderResponse;
import com.taivs.EcommerceWeb.services.order.SellerOrderService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
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
@RequestMapping("/seller/orders")
@RequiredArgsConstructor
public class SellerOrderController {
    private final SellerOrderService sellerOrderService;
    private final ExportService exportService;

    @GetMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<List<OrderResponse>> getMyShopOrders() {
        return ApiResponse.<List<OrderResponse>>builder()
                .result(sellerOrderService.getMyShopOrders())
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<OrderResponse> getShopOrderById(@PathVariable("id") String id) {
        return ApiResponse.<OrderResponse>builder()
                .result(sellerOrderService.getShopOrderById(id))
                .build();
    }

    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> confirmOrder(@PathVariable("id") String id) {
        sellerOrderService.confirmOrder(id);
        return ApiResponse.<Void>builder().build();
    }

    @PutMapping("/{id}/ship")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> shipOrder(@PathVariable("id") String id) {
        sellerOrderService.shipOrder(id);
        return ApiResponse.<Void>builder().build();
    }

    @PutMapping("/{id}/deliver")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> deliverOrder(@PathVariable("id") String id) {
        sellerOrderService.deliverOrder(id);
        return ApiResponse.<Void>builder().build();
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> cancelOrder(@PathVariable("id") String id,
            @RequestParam(required = false) String reason) {
        sellerOrderService.cancelOrder(id, reason);
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportMyOrders(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        byte[] data = exportService.exportSellerOrdersExcel(from, to);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=my-orders-report.xlsx")
                .contentType(
                        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }
}
