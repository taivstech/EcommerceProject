package com.taivs.EcommerceWeb.controllers.user;

import com.taivs.EcommerceWeb.dto.request.user.UserAddressRequest;
import com.taivs.EcommerceWeb.dto.response.user.UserAddressResponse;
import com.taivs.EcommerceWeb.services.user.UserAddressService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users/me/addresses")
@RequiredArgsConstructor
public class UserAddressController {
    private final UserAddressService userAddressService;

    @GetMapping
    public ApiResponse<List<UserAddressResponse>> getAll() {
        return ApiResponse.<List<UserAddressResponse>>builder()
                .result(userAddressService.getAllMyAddresses())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<UserAddressResponse> getById(@PathVariable String id) {
        return ApiResponse.<UserAddressResponse>builder()
                .result(userAddressService.getMyAddressById(id))
                .build();
    }

    @PostMapping
    public ApiResponse<Void> create(@RequestBody @Valid UserAddressRequest request) {
        userAddressService.createMyAddress(request);
        return ApiResponse.<Void>builder().build();
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> update(@PathVariable String id, @RequestBody @Valid UserAddressRequest request) {
        userAddressService.updateMyAddress(id, request);
        return ApiResponse.<Void>builder().build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        userAddressService.deleteMyAddress(id);
        return ApiResponse.<Void>builder().build();
    }

    @PatchMapping("/{id}/default")
    public ApiResponse<Void> setDefault(@PathVariable String id) {
        userAddressService.setMyDefaultAddress(id);
        return ApiResponse.<Void>builder().build();
    }
}

