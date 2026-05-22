package com.taivs.EcommerceWeb.services.dashboard;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface DashboardSseService {
    SseEmitter subscribeAdmin(String adminId);
    SseEmitter subscribeSeller(String sellerId);
    void removeAdmin(String adminId);
    void removeSeller(String sellerId);
}
