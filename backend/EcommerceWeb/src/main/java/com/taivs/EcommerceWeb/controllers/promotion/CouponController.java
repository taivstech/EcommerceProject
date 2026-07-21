package com.taivs.EcommerceWeb.controllers.promotion;

import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.dto.request.promotion.CreateCouponRequest;
import com.taivs.EcommerceWeb.dto.response.promotion.CouponResponse;
import com.taivs.EcommerceWeb.services.promotion.CouponService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/coupons")
@RequiredArgsConstructor
public class CouponController {
    private final CouponService couponService;



    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CouponResponse> create(@RequestBody @Valid CreateCouponRequest request) {
        return ApiResponse.<CouponResponse>builder()
                .result(couponService.create(request))
                .build();
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<CouponResponse>> getAllCoupons() {
        return ApiResponse.<List<CouponResponse>>builder()
                .result(couponService.getAllCoupons())
                .build();
    }


    @PostMapping("/seller")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<CouponResponse> createByShopOwner(@RequestBody @Valid CreateCouponRequest request) {
        return ApiResponse.<CouponResponse>builder()
                .result(couponService.createByShopOwner(request))
                .build();
    }

    @GetMapping("/seller/my")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<List<CouponResponse>> getMyShopCoupons() {
        return ApiResponse.<List<CouponResponse>>builder()
                .result(couponService.getMyShopCoupons())
                .build();
    }

    @GetMapping("/platform")
    public ApiResponse<List<CouponResponse>> getPlatformCoupons() {
        return ApiResponse.<List<CouponResponse>>builder()
                .result(couponService.getAvailablePlatformCoupons())
                .build();
    }

    @GetMapping("/shop/{shopId}")
    public ApiResponse<List<CouponResponse>> getShopCoupons(@PathVariable("shopId") String shopId) {
        return ApiResponse.<List<CouponResponse>>builder()
                .result(couponService.getAvailableShopCoupons(shopId))
                .build();
    }

    @GetMapping("/{code}")
    public ApiResponse<CouponResponse> getByCouponCode(@PathVariable String code) {
        return ApiResponse.<CouponResponse>builder()
                .result(couponService.getByCouponCode(code))
                .build();
    }

    @GetMapping("/product/{productId}")
    public ApiResponse<List<CouponResponse>> getCouponsForProduct(@PathVariable String productId) {
        return ApiResponse.<List<CouponResponse>>builder()
                .result(couponService.getAvailableCouponsForProduct(productId))
                .build();
    }


    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> deactivate(@PathVariable("id") String id) {
        couponService.deactivate(id);
        return ApiResponse.<Void>builder().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable("id") String id) {
        couponService.deleteCoupon(id);
        return ApiResponse.<Void>builder().build();
    }
}
