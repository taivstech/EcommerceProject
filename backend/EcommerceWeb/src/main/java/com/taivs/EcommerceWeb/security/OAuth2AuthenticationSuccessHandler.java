import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.security.CustomOAuth2User;
import com.taivs.EcommerceWeb.services.auth.AuthenticationService;
import com.taivs.EcommerceWeb.utils.CookieUtil;
//package com.taivs.EcommerceWeb.config.security.user;
//
//import com.taivs.socialmedia.entity.User;
//import com.taivs.socialmedia.service.AuthenticationService;
//import com.taivs.socialmedia.utils.CookieUtil;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import lombok.RequiredArgsConstructor;
//import lombok.experimental.NonFinal;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
//import org.springframework.stereotype.Component;
//import org.springframework.web.util.UriComponentsBuilder;
//
//import java.io.IOException;
//import java.util.Map;
//
//@Component
//@RequiredArgsConstructor
//@Slf4j
//public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
//
//    private final AuthenticationService authenticationService;
//
//    @NonFinal
//    @Value("${OUTBOUND_IDENTITY_REDIRECT_URI:http://localhost:5173/authenticate}")
//    private String frontendRedirectUri;
//
//    @Override
//    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
//                                       Authentication authentication) throws IOException, ServletException {
//
//        CustomOAuth2User oauth2User = (CustomOAuth2User) authentication.getPrincipal();
//        User user = oauth2User.getUser();
//
//        log.info("OAuth2 authentication successful for user: userId={}, username={}, email={}",
//                 user.getId(), user.getUsername(), user.getEmail());
//
//        try {
//            Map<String, String> tokens = authenticationService.generateTokensForOAuth2(user, request);
//            String accessToken = tokens.get("accessToken");
//            String refreshToken = tokens.get("refreshToken");
//
//            authenticationService.persistSessionTokens(user, accessToken, refreshToken);
//
//            // Set refresh token as HttpOnly cookie
//            CookieUtil.setRefreshTokenCookie(request, response, refreshToken);
//
//            // Only send accessToken in URL (refreshToken is in cookie)
//            String targetUrl = UriComponentsBuilder.fromUriString(frontendRedirectUri)
//                    .queryParam("accessToken", accessToken)
//                    .queryParam("userId", user.getId().toString())
//                    .queryParam("username", user.getUsername())
//                    .build()
//                    .toUriString();
//
//            log.info("OAuth2 login complete - redirecting to: {}", frontendRedirectUri);
//
//            getRedirectStrategy().sendRedirect(request, response, targetUrl);
//
//        } catch (Exception e) {
//            log.error("Error during OAuth2 authentication success handling", e);
//            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
//                             "Error generating authentication tokens");
//        }
//    }
//}
//
