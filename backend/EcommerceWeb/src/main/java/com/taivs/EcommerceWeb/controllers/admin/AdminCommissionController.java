package com.taivs.EcommerceWeb.controllers.admin;

import com.taivs.EcommerceWeb.dto.ApiResponse;
import com.taivs.EcommerceWeb.dto.request.admin.CommissionRateRequest;
import com.taivs.EcommerceWeb.dto.response.admin.CommissionRateResponse;
import com.taivs.EcommerceWeb.dto.response.admin.CommissionRevenueResponse;
import com.taivs.EcommerceWeb.services.order.CommissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/commission")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCommissionController {

    private final CommissionService commissionService;

    @GetMapping("/rates")
    public ApiResponse<List<CommissionRateResponse>> listRates() {
        return ApiResponse.<List<CommissionRateResponse>>builder()
                .result(commissionService.listRates())
                .build();
    }

    @PostMapping("/rates")
    public ApiResponse<CommissionRateResponse> upsertRate(@RequestBody CommissionRateRequest request) {
        return ApiResponse.<CommissionRateResponse>builder()
                .result(commissionService.upsertRate(request))
                .build();
    }

    @DeleteMapping("/rates/{rateId}")
    public ApiResponse<Void> deactivateRate(@PathVariable String rateId) {
        commissionService.deactivateRate(rateId);
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/revenue")
    public ApiResponse<CommissionRevenueResponse> revenue(
            @RequestParam(defaultValue = "30") int days) {
        return ApiResponse.<CommissionRevenueResponse>builder()
                .result(commissionService.getRevenueSummary(days))
                .build();
    }
}
