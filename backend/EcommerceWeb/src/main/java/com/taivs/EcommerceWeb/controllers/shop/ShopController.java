package com.taivs.EcommerceWeb.controllers.shop;

import com.taivs.EcommerceWeb.dto.response.shop.ShopFollowerResponse;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.dto.request.shop.ShopCreateRequest;
import com.taivs.EcommerceWeb.dto.request.shop.ShopUpdateRequest;
import com.taivs.EcommerceWeb.dto.response.shop.ShopResponse;
import com.taivs.EcommerceWeb.services.shop.ShopService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/shops")
public class ShopController {

    private final ShopService shopService;

    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<String> createMultipart(
            @RequestPart("shop") @Valid ShopCreateRequest request,
            @RequestPart(value = "file", required = false) MultipartFile logoFile) {
        shopService.create(request, logoFile);
        return ApiResponse.<String>builder().result("create successful").build();
    }

    @PostMapping(value = "/create", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<String> createJson(@RequestBody @Valid ShopCreateRequest request) {
        shopService.create(request, null);
        return ApiResponse.<String>builder().result("create successful").build();
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<String> updateMultipart(
            @RequestPart("shop") ShopUpdateRequest request,
            @RequestPart(value = "file", required = false) MultipartFile logoFile) {
        shopService.updateMyShop(request, logoFile);
        return ApiResponse.<String>builder().result("update successful").build();
    }

    @PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<String> updateJson(@RequestBody ShopUpdateRequest request) {
        shopService.updateMyShop(request, null);
        return ApiResponse.<String>builder().result("update successful").build();
    }

    @GetMapping
    public ApiResponse<ShopResponse> getInfo() {
        return ApiResponse.<ShopResponse>builder()
                .result(shopService.getMyShopInfo())
                .build();
    }

    @GetMapping("/byProvinceId/{provinceId}")
    public ApiResponse<List<String>> getShopIdByProvinceId(@PathVariable String provinceId) {
        return ApiResponse.<List<String>>builder()
                .result(shopService.getShopIdByProvinceId(provinceId))
                .build();
    }

    @GetMapping("/public")
    public ApiResponse<Page<ShopResponse>> getPublicShops(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.<Page<ShopResponse>>builder()
                .result(shopService.getAll("APPROVED", pageable))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<ShopResponse> getInfoById(@PathVariable String id) {
        return ApiResponse.<ShopResponse>builder()
                .result(shopService.getInfoById(id))
                .build();
    }

    @GetMapping("/getUserId/{shopId}")
    public ApiResponse<String> getUserIdByShopId(@PathVariable String shopId) {
        return ApiResponse.<String>builder()
                .result(shopService.getUserIdByShopId(shopId))
                .build();
    }

    @GetMapping("/getShopId/{userId}")
    public ApiResponse<String> getShopIdByUserId(@PathVariable String userId) {
        return ApiResponse.<String>builder()
                .result(shopService.getShopIdByUserId(userId))
                .build();
    }

    @PostMapping("/{id}/follow")
    @PreAuthorize("hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> followShop(@PathVariable("id") String id) {
        shopService.followShop(id);
        return ApiResponse.<Void>builder().build();
    }

    @DeleteMapping("/{id}/follow")
    @PreAuthorize("hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> unfollowShop(@PathVariable("id") String id) {
        shopService.unfollowShop(id);
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/{id}/follower-count")
    public ApiResponse<Long> getFollowerCount(@PathVariable("id") String id) {
        return ApiResponse.<Long>builder()
                .result(shopService.getFollowerCount(id))
                .build();
    }

    @GetMapping("/{id}/is-following")
    @PreAuthorize("hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Boolean> isFollowing(@PathVariable("id") String id) {
        return ApiResponse.<Boolean>builder()
                .result(shopService.isFollowing(id))
                .build();
    }

    @GetMapping("/followed")
    @PreAuthorize("hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<List<ShopFollowerResponse>> getMyFollowedShops() {
        return ApiResponse.<List<ShopFollowerResponse>>builder()
                .result(shopService.getMyFollowedShops())
                .build();
    }
}
