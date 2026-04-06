package com.taivs.EcommerceWeb.config.messaging;

import com.nimbusds.jwt.SignedJWT;
import com.taivs.EcommerceWeb.utils.CookieUtil;
import com.taivs.EcommerceWeb.utils.TokenIntrospector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private final TokenIntrospector tokenIntrospector;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) throws Exception {

        String token = CookieUtil.getAccessTokenFromCookie(request).orElse(null);

        if (token == null) {
            log.debug("WebSocket handshake: no access token cookie (will authenticate on STOMP CONNECT)");
            return true;
        }

        try {
            SignedJWT signedJWT = tokenIntrospector.verify(token);
            String userId = signedJWT.getJWTClaimsSet().getSubject();

            attributes.put("userId", userId);
            attributes.put("token", token);
            attributes.put("authenticatedAt", System.currentTimeMillis());

            log.debug("WebSocket handshake: attached userId={} from cookie token", userId);
            return true;
        } catch (Exception e) {
            log.warn("WebSocket handshake: invalid/expired cookie token (will authenticate on STOMP CONNECT) - {}", e.getMessage());
            return true;
        }
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {

    }
}

