package com.taivs.EcommerceWeb.serviceimpl.admin;

import com.taivs.EcommerceWeb.models.admin.ActivityLog;
import com.taivs.EcommerceWeb.repositories.admin.ActivityLogRepository;
import com.taivs.EcommerceWeb.utils.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogService {
    private final ActivityLogRepository activityLogRepository;

    @Async
    public void log(String action, String target, String details, HttpServletRequest request) {
        try {
            String userId = AuthUtils.currentUserId();
            String ipAddress = getClientIp(request);

            ActivityLog log = ActivityLog.builder()
                    .action(action)
                    .target(target)
                    .userId(userId)
                    .details(details)
                    .ipAddress(ipAddress)
                    .build();

            activityLogRepository.save(log);
        } catch (Exception e) {
            log.error("Failed to log activity: {}", action, e);
        }
    }

    @Async
    public void log(String action, String target) {
        try {
            String userId = AuthUtils.currentUserId();

            ActivityLog log = ActivityLog.builder()
                    .action(action)
                    .target(target)
                    .userId(userId)
                    .build();

            activityLogRepository.save(log);
        } catch (Exception e) {
            log.error("Failed to log activity: {}", action, e);
        }
    }

    public List<ActivityLog> getUserLogs(String userId) {
        return activityLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<ActivityLog> getMyLogs() {
        String userId = AuthUtils.currentUserId();
        return activityLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return null;
        
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
