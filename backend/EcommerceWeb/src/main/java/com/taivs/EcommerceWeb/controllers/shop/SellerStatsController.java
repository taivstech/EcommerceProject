package com.taivs.EcommerceWeb.controllers.shop;

import com.taivs.EcommerceWeb.dto.ApiResponse;
import com.taivs.EcommerceWeb.dto.response.shop.SellerTopCustomerStats;
import com.taivs.EcommerceWeb.services.shop.SellerStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/seller/stats")
@RequiredArgsConstructor
public class SellerStatsController {

    private final SellerStatsService sellerStatsService;

    @GetMapping("/top-customers")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<List<SellerTopCustomerStats>> getTopCustomers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.<List<SellerTopCustomerStats>>builder()
                .result(sellerStatsService.getTopCustomers(from, to, limit))
                .build();
    }
}
