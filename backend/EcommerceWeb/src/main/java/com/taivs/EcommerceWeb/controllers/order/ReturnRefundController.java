package com.taivs.EcommerceWeb.controllers.order;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.dto.request.order.CreateReturnRequest;
import com.taivs.EcommerceWeb.dto.request.order.SellerReturnActionRequest;
import com.taivs.EcommerceWeb.dto.response.order.ReturnRequestResponse;
import com.taivs.EcommerceWeb.services.order.ReturnRefundService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/returns")
@RequiredArgsConstructor
public class ReturnRefundController {

    private final ReturnRefundService returnRefundService;

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<ReturnRequestResponse> createReturn(@RequestBody @Valid CreateReturnRequest request) {
        return ApiResponse.<ReturnRequestResponse>builder()
                .result(returnRefundService.createReturnRequest(request))
                .build();
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<List<ReturnRequestResponse>> myReturns() {
        return ApiResponse.<List<ReturnRequestResponse>>builder()
                .result(returnRefundService.getMyReturnRequests())
                .build();
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> cancelReturn(@PathVariable String id) {
        returnRefundService.cancelReturnRequest(id);
        return ApiResponse.<Void>builder().message("Return request cancelled").build();
    }

    @PutMapping("/{id}/confirm-returned")
    @PreAuthorize("hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<ReturnRequestResponse> confirmReturned(@PathVariable String id) {
        return ApiResponse.<ReturnRequestResponse>builder()
                .result(returnRefundService.confirmReturned(id))
                .build();
    }

    @GetMapping("/seller")
    @PreAuthorize("hasRole('SELLER')")
    public ApiResponse<List<ReturnRequestResponse>> sellerReturns() {
        return ApiResponse.<List<ReturnRequestResponse>>builder()
                .result(returnRefundService.getSellerReturnRequests())
                .build();
    }

    @PutMapping("/{id}/action")
    @PreAuthorize("hasRole('SELLER')")
    public ApiResponse<ReturnRequestResponse> sellerAction(
            @PathVariable String id,
            @RequestBody SellerReturnActionRequest request) {
        return ApiResponse.<ReturnRequestResponse>builder()
                .result(returnRefundService.sellerAction(id, request))
                .build();
    }

    @PutMapping("/{id}/confirm-refund")
    @PreAuthorize("hasRole('SELLER')")
    public ApiResponse<ReturnRequestResponse> confirmRefund(@PathVariable String id) {
        return ApiResponse.<ReturnRequestResponse>builder()
                .result(returnRefundService.confirmRefund(id))
                .build();
    }
}
