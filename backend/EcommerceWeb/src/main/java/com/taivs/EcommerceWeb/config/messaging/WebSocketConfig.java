package com.taivs.EcommerceWeb.config.messaging;

import com.nimbusds.jwt.SignedJWT;
import com.taivs.EcommerceWeb.utils.TokenIntrospector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor webSocketAuthInterceptor;
    private final TokenIntrospector tokenIntrospector;

    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:http://localhost:*}")
    private java.util.List<String> allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler taskScheduler = new org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler();
        taskScheduler.setPoolSize(1);
        taskScheduler.setThreadNamePrefix("wss-heartbeat-thread-");
        taskScheduler.initialize();

        config.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[] { 10000, 10000 })
                .setTaskScheduler(taskScheduler);

        config.setApplicationDestinationPrefixes("/app");

        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) {
                    return message;
                }

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    Principal user = accessor.getUser();
                    if (user != null) {
                        log.debug("STOMP CONNECT already authenticated via Cookie: userId={}", user.getName());
                        return message;
                    }

                    try {
                        String auth = accessor.getFirstNativeHeader("Authorization");
                        if (auth != null && auth.startsWith("Bearer ")) {
                            String token = auth.substring(7);
                            SignedJWT signedJWT = tokenIntrospector.verify(token);
                            String userId = signedJWT.getJWTClaimsSet().getSubject();

                            accessor.setUser(new StompPrincipal(userId));
                            if (accessor.getSessionAttributes() != null) {
                                accessor.getSessionAttributes().put("userId", userId);
                                accessor.getSessionAttributes().put("token", token);
                            }
                            log.debug("STOMP CONNECT authenticated userId={}", userId);
                        } else {
                            log.warn("STOMP CONNECT missing Authorization header");
                            throw new IllegalArgumentException("Missing Authorization header");
                        }
                    } catch (Exception e) {
                        log.warn("STOMP CONNECT authentication failed", e);
                        throw new IllegalArgumentException("Invalid token");
                    }
                }

                return message;
            }
        });
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins.toArray(new String[0]))
                .setHandshakeHandler(new DefaultHandshakeHandler() {
                    @Override
                    protected Principal determineUser(
                            org.springframework.http.server.ServerHttpRequest request,
                            org.springframework.web.socket.WebSocketHandler wsHandler,
                            Map<String, Object> attributes) {
                        Object userId = attributes.get("userId");
                        if (userId != null) {
                            return new StompPrincipal(userId.toString());
                        }
                        return null;
                    }
                })
                .addInterceptors(webSocketAuthInterceptor);
    }
}
