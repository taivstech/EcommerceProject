package com.taivs.EcommerceWeb.utils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.experimental.UtilityClass;
import org.springframework.http.ResponseCookie;

import java.util.Arrays;
import java.util.Optional;

@UtilityClass
public class CookieUtil {

    private static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
    private static final String ACCESS_TOKEN_COOKIE_NAME = "accessToken";

    private static final int REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;
    private static final int ACCESS_TOKEN_MAX_AGE = 15 * 60;

    public static void setRefreshTokenCookie(HttpServletRequest request, HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/")
                .maxAge(REFRESH_TOKEN_MAX_AGE)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    public static Optional<String> getRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

    public static void deleteRefreshTokenCookie(HttpServletRequest request, HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(isSecureRequest(request))
                .sameSite("Strict")
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    public static void setAccessTokenCookie(HttpServletRequest request, HttpServletResponse response, String accessToken) {
        ResponseCookie cookie = ResponseCookie.from(ACCESS_TOKEN_COOKIE_NAME, accessToken)
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/")
                .maxAge(ACCESS_TOKEN_MAX_AGE)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    public static Optional<String> getAccessTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }

        return Arrays.stream(request.getCookies())
                .filter(cookie -> ACCESS_TOKEN_COOKIE_NAME.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

    public static Optional<String> getAccessTokenFromCookie(org.springframework.http.server.ServerHttpRequest request) {
        var cookies = request.getHeaders().get("Cookie");
        if (cookies == null || cookies.isEmpty()) {
            return Optional.empty();
        }

        for (String cookieHeader : cookies) {
            String[] cookiePairs = cookieHeader.split(";");
            for (String cookiePair : cookiePairs) {
                String[] keyValue = cookiePair.trim().split("=", 2);
                if (keyValue.length == 2 && ACCESS_TOKEN_COOKIE_NAME.equals(keyValue[0])) {
                    return Optional.of(keyValue[1]);
                }
            }
        }

        return Optional.empty();
    }

    public static void deleteAccessTokenCookie(HttpServletRequest request, HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(ACCESS_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(isSecureRequest(request))
                .sameSite("Strict")
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    private static boolean isSecureRequest(HttpServletRequest request) {
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        if (forwardedProto != null && !forwardedProto.isBlank()) {
            return "https".equalsIgnoreCase(forwardedProto.trim());
        }
        return request.isSecure();
    }
}
