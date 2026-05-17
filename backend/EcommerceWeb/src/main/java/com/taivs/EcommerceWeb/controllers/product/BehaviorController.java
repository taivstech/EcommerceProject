package com.taivs.EcommerceWeb.controllers.product;

import com.taivs.EcommerceWeb.dto.ApiResponse;
import com.taivs.EcommerceWeb.dto.request.product.BehaviorEventRequest;
import com.taivs.EcommerceWeb.services.product.BehaviorTrackingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/behavior")
@RequiredArgsConstructor
public class BehaviorController {

    private final BehaviorTrackingService behaviorTrackingService;

    @PostMapping("/track")
    public ResponseEntity<Void> track(
            @RequestBody BehaviorEventRequest request,
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            HttpServletRequest httpRequest) {
        String userId = null;
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()
                    && !"anonymousUser".equalsIgnoreCase(auth.getName())) {
                userId = auth.getName();
            }
        } catch (Exception ignored) {
        }
        behaviorTrackingService.track(userId, sessionId, request);

        return ResponseEntity.accepted().build();
    }
}
