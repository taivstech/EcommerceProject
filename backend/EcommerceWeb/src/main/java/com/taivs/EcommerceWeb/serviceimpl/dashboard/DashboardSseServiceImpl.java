package com.taivs.EcommerceWeb.serviceimpl.dashboard;

import com.taivs.EcommerceWeb.services.admin.AdminStatsService;
import com.taivs.EcommerceWeb.services.shop.ShopService;
import com.taivs.EcommerceWeb.services.dashboard.DashboardSseService;
import com.taivs.EcommerceWeb.utils.AuthUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardSseServiceImpl implements DashboardSseService {

    private final AdminStatsService adminStatsService;
    private final ShopService shopService;

    // Use ConcurrentHashMap to safely manage active emitters
    private final Map<String, SseEmitter> adminEmitters = new ConcurrentHashMap<>();
    private final Map<String, SseEmitter> sellerEmitters = new ConcurrentHashMap<>();

    @Override
    public SseEmitter subscribeAdmin(String adminId) {
        // Timeout: 30 minutes. The client will auto-reconnect when it times out.
        SseEmitter emitter = new SseEmitter(1800000L);
        adminEmitters.put(adminId, emitter);

        emitter.onCompletion(() -> removeAdmin(adminId));
        emitter.onTimeout(() -> removeAdmin(adminId));
        emitter.onError((e) -> removeAdmin(adminId));

        // Send an initial connect event
        try {
            emitter.send(SseEmitter.event().name("CONNECT").data("Connected to Admin Dashboard Stream"));
            // Immediately push the first payload
            emitter.send(SseEmitter.event().name("STATS_UPDATE").data(adminStatsService.getDashboardStats()));
        } catch (IOException e) {
            removeAdmin(adminId);
        }

        return emitter;
    }

    @Override
    public SseEmitter subscribeSeller(String sellerId) {
        SseEmitter emitter = new SseEmitter(1800000L);
        sellerEmitters.put(sellerId, emitter);

        emitter.onCompletion(() -> removeSeller(sellerId));
        emitter.onTimeout(() -> removeSeller(sellerId));
        emitter.onError((e) -> removeSeller(sellerId));

        try {
            emitter.send(SseEmitter.event().name("CONNECT").data("Connected to Seller Dashboard Stream"));
            // For seller, we need to bypass AuthUtils since this might run async or without context initially,
            // but the ShopService currently depends on AuthUtils internally. 
            // We might need to refactor ShopService to accept sellerId, or mock the security context.
            // Let's defer initial fetch to the scheduled job which we can run with SecurityContext, or just send a ping.
        } catch (IOException e) {
            removeSeller(sellerId);
        }

        return emitter;
    }

    @Override
    public void removeAdmin(String adminId) {
        adminEmitters.remove(adminId);
    }

    @Override
    public void removeSeller(String sellerId) {
        sellerEmitters.remove(sellerId);
    }

    // Broadcast updates every 10 seconds to active clients
    @Scheduled(fixedRate = 10000)
    public void broadcastAdminStats() {
        if (adminEmitters.isEmpty()) {
            return;
        }

        try {
            // Only query DB once for all admins
            Object stats = adminStatsService.getDashboardStats();
            adminEmitters.forEach((id, emitter) -> {
                try {
                    emitter.send(SseEmitter.event().name("STATS_UPDATE").data(stats));
                } catch (IOException e) {
                    removeAdmin(id);
                }
            });
        } catch (Exception e) {
            log.error("Failed to broadcast admin stats", e);
        }
    }

    @Scheduled(fixedRate = 10000)
    public void broadcastSellerStats() {
        if (sellerEmitters.isEmpty()) {
            return;
        }

        sellerEmitters.forEach((sellerId, emitter) -> {
            try {
                // Here we have a problem: ShopService.getDashboardStats() uses AuthUtils.currentUserId().
                // Inside a @Scheduled method, there is no SecurityContext!
                // So we must use a method that takes userId.
                // Let's use shopService.getDashboardStatsByUserId(sellerId) if we create it.
                Object stats = shopService.getDashboardStatsByUserId(sellerId);
                emitter.send(SseEmitter.event().name("STATS_UPDATE").data(stats));
            } catch (Exception e) {
                removeSeller(sellerId);
            }
        });
    }
}
