package com.taivs.EcommerceWeb.controllers.order;

import com.taivs.EcommerceWeb.dto.request.order.CheckoutRequest;
import com.taivs.EcommerceWeb.dto.response.order.OrderResponse;
import com.taivs.EcommerceWeb.services.order.BuyerOrderService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {
    private final BuyerOrderService buyerOrderService;

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('order:view_own') or hasAuthority('order:read') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<List<OrderResponse>> myOrders() {
        return ApiResponse.<List<OrderResponse>>builder()
                .result(buyerOrderService.getMyOrders())
                .build();
    }

    @GetMapping("/me/{id}")
    @PreAuthorize("hasAuthority('order:view_own') or hasAuthority('order:read') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<OrderResponse> myOrder(@PathVariable String id) {
        return ApiResponse.<OrderResponse>builder()
                .result(buyerOrderService.getMyOrderById(id))
                .build();
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasAuthority('order:create') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<OrderResponse> checkout(@RequestBody @Valid CheckoutRequest request) {
        return ApiResponse.<OrderResponse>builder()
                .result(buyerOrderService.checkout(request))
                .build();
    }

    @PutMapping("/{id}/confirm-receipt")
    @PreAuthorize("hasAuthority('order:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> confirmReceipt(@PathVariable("id") String id) {
        buyerOrderService.confirmReceipt(id);
        return ApiResponse.<Void>builder().build();
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('order:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> cancelMyOrder(@PathVariable("id") String id,
            @RequestParam(required = false) String reason) {
        buyerOrderService.cancelMyOrder(id, reason);
        return ApiResponse.<Void>builder().build();
    }
}
