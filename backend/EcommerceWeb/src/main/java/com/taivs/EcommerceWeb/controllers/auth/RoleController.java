package com.taivs.EcommerceWeb.controllers.auth;

import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.dto.request.auth.RoleRequest;
import com.taivs.EcommerceWeb.dto.response.auth.RoleResponse;
import com.taivs.EcommerceWeb.services.auth.RoleService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {
    private final RoleService roleService;

    @PostMapping
    @PreAuthorize("hasAuthority('user:manage') or hasAuthority('system:manage') or hasRole('ADMIN')")
    public ApiResponse<RoleResponse> create(@RequestBody @Valid RoleRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .result(roleService.create(request))
                .build();
    }

    @GetMapping
    @PreAuthorize("hasAuthority('user:manage') or hasAuthority('system:manage') or hasRole('ADMIN')")
    public ApiResponse<List<RoleResponse>> getAll() {
        return ApiResponse.<List<RoleResponse>>builder()
                .result(roleService.getAll())
                .build();
    }

    @DeleteMapping("/{name}")
    @PreAuthorize("hasAuthority('user:manage') or hasAuthority('system:manage') or hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable("name") String name) {
        roleService.deleteByName(name);
        return ApiResponse.<Void>builder().build();
    }
}
