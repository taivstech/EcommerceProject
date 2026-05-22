package com.taivs.EcommerceWeb.controllers.dashboard;

import com.taivs.EcommerceWeb.services.dashboard.DashboardSseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.taivs.EcommerceWeb.utils.AuthUtils;

@RestController
@RequestMapping("/dashboard/stream")
@RequiredArgsConstructor
public class DashboardSseController {

    private final DashboardSseService dashboardSseService;

    @GetMapping(value = "/admin", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public SseEmitter streamAdminDashboard() {
        String adminId = AuthUtils.currentUserId();
        return dashboardSseService.subscribeAdmin(adminId);
    }

    @GetMapping(value = "/seller", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('SELLER')")
    public SseEmitter streamSellerDashboard() {
        String sellerId = AuthUtils.currentUserId();
        return dashboardSseService.subscribeSeller(sellerId);
    }
}
