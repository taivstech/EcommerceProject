package com.taivs.EcommerceWeb.controllers.auth;

import com.nimbusds.jose.JOSEException;
import com.taivs.EcommerceWeb.dto.request.auth.AuthenticationRequest;
import com.taivs.EcommerceWeb.dto.request.auth.ExchangeTokenRequest;
import com.taivs.EcommerceWeb.dto.request.auth.ForgotPasswordRequest;
import com.taivs.EcommerceWeb.dto.request.auth.IntrospectRequest;
import com.taivs.EcommerceWeb.dto.request.auth.RefreshRequest;
import com.taivs.EcommerceWeb.dto.request.auth.ResetPasswordRequest;
import com.taivs.EcommerceWeb.dto.response.auth.AuthenticationResponse;
import com.taivs.EcommerceWeb.dto.response.auth.AuthenticationTokens;
import com.taivs.EcommerceWeb.dto.response.auth.IntrospectResponse;
import com.taivs.EcommerceWeb.dto.response.auth.LogoutResponse;
import com.taivs.EcommerceWeb.dto.response.auth.OutboundOAuthStateResponse;
import com.taivs.EcommerceWeb.services.auth.AuthenticationService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import com.taivs.EcommerceWeb.utils.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthenticationController {
    private final AuthenticationService authenticationService;

    @GetMapping("/outbound/state")
    ApiResponse<OutboundOAuthStateResponse> issueOutboundState() {
        OutboundOAuthStateResponse result = authenticationService.issueOutboundOAuthState();
        return ApiResponse.<OutboundOAuthStateResponse>builder()
                .code(200)
                .result(result)
                .build();
    }

    @PostMapping("/token")
    ApiResponse<AuthenticationResponse> authenticate(
            @RequestBody AuthenticationRequest authRequest,
            HttpServletRequest request,
            HttpServletResponse response) {
        AuthenticationTokens tokens = authenticationService.authenticate(authRequest);

        CookieUtil.setAccessTokenCookie(request, response, tokens.getAccessToken());
        CookieUtil.setRefreshTokenCookie(request, response, tokens.getRefreshToken());
        AuthenticationResponse result = toApiResponse(tokens);

        return ApiResponse.<AuthenticationResponse>builder()
                .code(201)
                .result(result)
                .build();
    }

    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> authenticate(@RequestBody IntrospectRequest request)
            throws ParseException, JOSEException {
        var result = authenticationService.introspect(request);
        return ApiResponse.<IntrospectResponse>builder().result(result).build();
    }

    @PostMapping("/refresh")
    ApiResponse<AuthenticationResponse> authenticate(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody(required = false) RefreshRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse)
            throws ParseException, JOSEException {

        String refreshToken = CookieUtil.getRefreshTokenFromCookie(httpRequest)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        String accessToken = extractBearerToken(authorization);
        if ((accessToken == null || accessToken.isBlank()) && request != null) {
            accessToken = request.getAccessToken();
        }

        AuthenticationTokens tokens = authenticationService.refreshToken(refreshToken, accessToken);

        CookieUtil.setAccessTokenCookie(httpRequest, httpResponse, tokens.getAccessToken());
        CookieUtil.setRefreshTokenCookie(httpRequest, httpResponse, tokens.getRefreshToken());
        AuthenticationResponse result = toApiResponse(tokens);

        return ApiResponse.<AuthenticationResponse>builder().result(result).build();
    }

    @PostMapping("/logout")
    ApiResponse<LogoutResponse> logout(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) throws ParseException, JOSEException {

        String accessToken = extractBearerToken(authorization);
        if (accessToken == null || accessToken.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String refreshToken = CookieUtil.getRefreshTokenFromCookie(httpRequest)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        LogoutResponse logoutResponse = authenticationService.logout(accessToken, refreshToken);

        CookieUtil.deleteAccessTokenCookie(httpRequest, httpResponse);
        CookieUtil.deleteRefreshTokenCookie(httpRequest, httpResponse);

        return ApiResponse.<LogoutResponse>builder()
                .result(logoutResponse)
                .build();
    }

    @PostMapping("/forgot-password")
    ApiResponse<Void> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        authenticationService.forgotPassword(ForgotPasswordRequest.builder().email(request.getEmail()).build());
        return ApiResponse.<Void>builder()
                .message("Link has been sent")
                .build();
    }

    @PostMapping("/reset-password")
    ApiResponse<Void> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        authenticationService.resetPassword(ResetPasswordRequest.builder()
                .newPassword(request.getNewPassword())
                .token(request.getToken())
                .build());
        return ApiResponse.<Void>builder()
                .message("Password reset successfully")
                .build();
    }

    @PostMapping("/outbound/authentication")
    ApiResponse<AuthenticationResponse> exchangeOAuth2Code(
            @RequestBody @Valid ExchangeTokenRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        log.info("OAuth2 code exchange request received");
        AuthenticationTokens tokens = authenticationService.authenticateWithOAuth2Code(request, httpRequest);

        CookieUtil.setAccessTokenCookie(httpRequest, httpResponse, tokens.getAccessToken());
        CookieUtil.setRefreshTokenCookie(httpRequest, httpResponse, tokens.getRefreshToken());
        AuthenticationResponse result = toApiResponse(tokens);

        return ApiResponse.<AuthenticationResponse>builder()
                .code(200)
                .result(result)
                .build();
    }

    private String extractBearerToken(String authorization) {
        if (authorization == null)
            return null;
        String prefix = "Bearer ";
        if (!authorization.startsWith(prefix))
            return null;
        return authorization.substring(prefix.length()).trim();
    }

    private AuthenticationResponse toApiResponse(AuthenticationTokens tokens) {
        return AuthenticationResponse.builder()
                .accessToken(tokens.getAccessToken())
                .authenticated(tokens.isAuthenticated())
                .build();
    }

    @GetMapping("/check-username")
    ApiResponse<Boolean> checkUsernameAvailable(@RequestParam String username) {
        boolean available = authenticationService.checkUsernameAvailable(username);
        return ApiResponse.<Boolean>builder()
                .result(available)
                .message(available ? "Username is available" : "Username is already taken")
                .build();
    }

    @GetMapping("/check-email")
    ApiResponse<Boolean> checkEmailAvailable(@RequestParam String email) {
        boolean available = authenticationService.checkEmailAvailable(email);
        return ApiResponse.<Boolean>builder()
                .result(available)
                .message(available ? "Email is available" : "Email is already registered")
                .build();
    }

    @GetMapping("/verify-email")
    ApiResponse<AuthenticationResponse> verifyEmail(
            @RequestParam String token,
            HttpServletRequest request,
            HttpServletResponse response) {
        AuthenticationTokens tokens = authenticationService.verifyEmail(token);
        CookieUtil.setAccessTokenCookie(request, response, tokens.getAccessToken());
        CookieUtil.setRefreshTokenCookie(request, response, tokens.getRefreshToken());
        return ApiResponse.<AuthenticationResponse>builder()
                .code(200)
                .result(toApiResponse(tokens))
                .message("Email verified successfully")
                .build();
    }

}
