package com.taivs.EcommerceWeb.security;

import com.taivs.EcommerceWeb.utils.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CookieBearerTokenResolver implements BearerTokenResolver {

    private static final String BEARER_PREFIX = "Bearer ";

    private static final String[] PUBLIC_PATHS = {
            "/api/auth/token",
            "/api/auth/refresh",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/outbound",
            "/api/auth/introspect",
            "/api/auth/logout",
            "/api/auth/verify-email",
            "/api/auth/resend-verification",
            "/api/users/registration",
            "/api/file/",
            "/api/files/",
            "/api/ws/",
            "/api/categories/",
            "/api/products/",
            "/api/reviews/",
            "/api/ghn/",
            "/api/shops/public",
            "/api/coupons/platform",
            "/api/coupons/shop/",
            "/api/orderItems/",
            "/api/oauth2/",
            "/api/login/oauth2/",
            "/api/payment/callback/",
            "/api/payment/vnpay/ipn",
            "/api/search/products",
            "/api/search/suggest",
            "/api/actuator/",
    };

    @Override
    public String resolve(HttpServletRequest request) {

        String path = request.getRequestURI();

        int queryIndex = path.indexOf('?');
        if (queryIndex > 0) {
            path = path.substring(0, queryIndex);
        }

        for (String publicPath : PUBLIC_PATHS) {

            if (path.startsWith(publicPath) || 
                (publicPath.endsWith("/") && path.startsWith(publicPath.substring(0, publicPath.length() - 1)))) {
                
                // Do NOT skip token resolution for state-mutating requests (POST, PUT, DELETE, PATCH)
                // on resource catalog endpoints (categories, products, reviews, coupons)
                String method = request.getMethod();
                if (("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || 
                     "DELETE".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) && 
                    (path.startsWith("/api/categories") || path.startsWith("/api/products") || 
                     path.startsWith("/api/reviews") || path.startsWith("/api/coupons/shop"))) {
                    continue;
                }

                log.debug("Skipping token resolution for public endpoint: {}", request.getRequestURI());
                return null;
            }
        }

        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith(BEARER_PREFIX)) {
            String token = authorizationHeader.substring(BEARER_PREFIX.length()).trim();
            if (!token.isEmpty()) {
                log.debug("Token resolved from Authorization header");
                return token;
            }
        }

        String cookieToken = CookieUtil.getAccessTokenFromCookie(request).orElse(null);
        if (cookieToken != null && !cookieToken.isEmpty()) {
            log.debug("Token resolved from cookie");
            return cookieToken;
        }

        log.debug("No bearer token found in request");
        return null;
    }
}
