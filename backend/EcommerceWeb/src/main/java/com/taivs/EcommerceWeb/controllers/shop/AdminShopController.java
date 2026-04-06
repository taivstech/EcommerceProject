package com.taivs.EcommerceWeb.controllers.shop;

import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.dto.request.shop.ShopModerationRequest;
import com.taivs.EcommerceWeb.dto.response.shop.ShopResponse;
import com.taivs.EcommerceWeb.services.shop.ShopService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/shops")
@RequiredArgsConstructor
public class AdminShopController {
    private final ShopService shopService;

    @GetMapping
    @PreAuthorize("hasAuthority('shop:view_all') or hasAuthority('shop:approve') or hasRole('ADMIN')")
    public ApiResponse<Page<ShopResponse>> getAll(
            @RequestParam(value = "status", required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.<Page<ShopResponse>>builder()
                .result(shopService.getAll(status, pageable))
                .build();
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('shop:approve') or hasRole('ADMIN')")
    public ApiResponse<Void> approve(@PathVariable("id") String id) {
        shopService.approve(id);
        return ApiResponse.<Void>builder().build();
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('shop:approve') or hasRole('ADMIN')")
    public ApiResponse<Void> reject(@PathVariable("id") String id, @RequestBody(required = false) ShopModerationRequest request) {
        shopService.reject(id, request == null ? null : request.getReason());
        return ApiResponse.<Void>builder().build();
    }

    @PatchMapping("/{id}/suspend")
    @PreAuthorize("hasAuthority('shop:suspend') or hasAuthority('shop:approve') or hasRole('ADMIN')")
    public ApiResponse<Void> suspend(@PathVariable("id") String id, @RequestBody(required = false) ShopModerationRequest request) {
        shopService.suspend(id, request == null ? null : request.getReason());
        return ApiResponse.<Void>builder().build();
    }
}

