package com.taivs.EcommerceWeb.config.security;

import com.taivs.EcommerceWeb.dto.request.auth.AuthenticationRequest;
import com.taivs.EcommerceWeb.dto.response.auth.AuthenticationTokens;
import com.taivs.EcommerceWeb.models.admin.AuditLog;
import com.taivs.EcommerceWeb.repositories.admin.AuditLogRepository;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthAuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @AfterReturning(
            pointcut = "execution(* com.taivs.EcommerceWeb.serviceimpl.auth.AuthenticationServiceImpl.authenticate(..))",
            returning = "tokens")
    public void afterLoginSuccess(JoinPoint joinPoint, AuthenticationTokens tokens) {
        try {
            Object[] args = joinPoint.getArgs();
            AuthenticationRequest request = (AuthenticationRequest) args[0];
            String identifier = request.getEmailOrPhone();

            String userId = userRepository.findByEmailOrPhoneWithRoles(identifier)
                    .or(() -> userRepository.findByUsernameWithRoles(identifier))
                    .map(u -> u.getId())
                    .orElse(null);

            saveAuditLog(userId, identifier, "LOGIN_SUCCESS", null);
            log.info("AUDIT: LOGIN_SUCCESS identifier={}", identifier);
        } catch (Exception e) {
            log.error("AUDIT logging failed: {}", e.getMessage());
        }
    }

    @AfterThrowing(
            pointcut = "execution(* com.taivs.EcommerceWeb.serviceimpl.auth.AuthenticationServiceImpl.authenticate(..))",
            throwing = "ex")
    public void afterLoginFailed(JoinPoint joinPoint, Exception ex) {
        try {
            Object[] args = joinPoint.getArgs();
            AuthenticationRequest request = (AuthenticationRequest) args[0];
            String identifier = request.getEmailOrPhone();

            String userId = userRepository.findByEmailOrPhoneWithRoles(identifier)
                    .or(() -> userRepository.findByUsernameWithRoles(identifier))
                    .map(u -> u.getId())
                    .orElse(null);

            saveAuditLog(userId, identifier, "LOGIN_FAILED", ex.getMessage());
            log.warn("AUDIT: LOGIN_FAILED identifier={} reason={}", identifier, ex.getMessage());
        } catch (Exception e) {
            log.error("AUDIT logging failed: {}", e.getMessage());
        }
    }

    @AfterReturning(
            pointcut = "execution(* com.taivs.EcommerceWeb.serviceimpl.auth.AuthenticationServiceImpl.logout(..))")
    public void afterLogout(JoinPoint joinPoint) {
        try {
            String userId = getCurrentUserId();
            saveAuditLog(userId, null, "LOGOUT", null);
            log.info("AUDIT: LOGOUT user={}", userId);
        } catch (Exception e) {
            log.error("AUDIT logging failed: {}", e.getMessage());
        }
    }

    @AfterReturning(
            pointcut = "execution(* com.taivs.EcommerceWeb.serviceimpl.auth.AuthenticationServiceImpl.refreshToken(..))",
            returning = "tokens")
    public void afterTokenRefresh(JoinPoint joinPoint, AuthenticationTokens tokens) {
        try {
            String userId = getCurrentUserId();
            saveAuditLog(userId, null, "TOKEN_REFRESH", null);
        } catch (Exception e) {
            log.error("AUDIT logging failed: {}", e.getMessage());
        }
    }

    @AfterReturning(
            pointcut = "execution(* com.taivs.EcommerceWeb.serviceimpl.auth.AuthenticationServiceImpl.resetPassword(..))")
    public void afterPasswordReset(JoinPoint joinPoint) {
        try {
            saveAuditLog(null, null, "PASSWORD_RESET", null);
            log.info("AUDIT: PASSWORD_RESET");
        } catch (Exception e) {
            log.error("AUDIT logging failed: {}", e.getMessage());
        }
    }

    private void saveAuditLog(String userId, String username, String action, String details) {
        HttpServletRequest httpReq = getHttpRequest();

        AuditLog auditLog = AuditLog.builder()
                .userId(userId)
                .username(username)
                .action(action)
                .ipAddress(httpReq != null ? getClientIp(httpReq) : null)
                .userAgent(httpReq != null ? httpReq.getHeader("User-Agent") : null)
                .details(details)
                .build();

        auditLogRepository.save(auditLog);
    }

    private HttpServletRequest getHttpRequest() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attrs != null ? attrs.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String getCurrentUserId() {
        try {
            return org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication().getName();
        } catch (Exception e) {
            return null;
        }
    }
}
