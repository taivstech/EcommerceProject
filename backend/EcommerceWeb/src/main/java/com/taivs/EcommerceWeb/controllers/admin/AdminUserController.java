package com.taivs.EcommerceWeb.controllers.admin;

import com.taivs.EcommerceWeb.dto.ApiResponse;
import com.taivs.EcommerceWeb.dto.request.user.ActiveUserRequest;
import com.taivs.EcommerceWeb.dto.request.user.DeactivateUser;
import com.taivs.EcommerceWeb.dto.response.user.UserResponse;
import com.taivs.EcommerceWeb.services.user.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserManagementService userManagementService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Page<UserResponse>> getAllUsers(
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.<Page<UserResponse>>builder()
                .result(userManagementService.getUsers(pageable))
                .build();
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> activateUser(@PathVariable String id) {
        userManagementService.activeUser(new ActiveUserRequest(id));
        return ApiResponse.<Void>builder().build();
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deactivateUser(@PathVariable String id) {
        userManagementService.deactivateUser(new DeactivateUser(id));
        return ApiResponse.<Void>builder().build();
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> updateUserRoles(
            @PathVariable String id,
            @RequestBody Map<String, List<String>> body
    ) {
        List<String> roles = body.get("roles");
        userManagementService.updateUserRoles(id, roles);
        return ApiResponse.<Void>builder().build();
    }
}
