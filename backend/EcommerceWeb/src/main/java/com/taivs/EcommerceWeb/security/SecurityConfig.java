package com.taivs.EcommerceWeb.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taivs.EcommerceWeb.security.CustomOAuth2UserService;
import com.taivs.EcommerceWeb.security.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // Enable @PreAuthorize, @PostAuthorize, @Secured
@RequiredArgsConstructor
public class SecurityConfig {

    private final String[] PUBLIC_ENDPOINTS = {
            // Auth
            "/auth/token",
            "/auth/introspect",
            "/auth/logout",
            "/auth/refresh",
            "/auth/verify-email",
            "/auth/resend-verification",
            "/auth/forgot-password",
            "/auth/reset-password",
            "/auth/outbound/authentication",
            // User registration
            "/users/registration",
            // Files
            "/file/**",
            "/files/**",
            // WebSocket
            "/ws/**",
            // Public catalog
            "/categories/**",
            "/products/**",
            "/reviews/**",
            "/ghn/**",
            // Public shop endpoints
            "/shops/public",
            "/shops/{id}",
            "/shops/{id}/follower-count",
            "/shops/byProvinceId/**",
            "/shops/getUserId/**",
            "/shops/getShopId/**",
            // Coupons (read-only)
            "/coupons/platform",
            "/coupons/shop/**",
            "/coupons/{code}",
            // Order items (read-only utility)
            "/orderItems/**",
            // OAuth2
            "/oauth2/**",
            "/login/oauth2/**",
            // OAuth2 state
            "/auth/outbound/state",
            // Payment callbacks (IPN/webhooks from payment gateways)
            "/payment/callback/**",
            "/payment/vnpay/ipn",
            // Elasticsearch search (public)
            "/search/products",
            "/search/suggest",
            // Flash sale (public read)
            "/flash-sales/active",
            "/flash-sales/{id}",
            // Actuator health (Docker/LB probes)
            "/actuator/health",
            "/actuator/health/**",

    };

    // Warehouse & employee endpoints are NOT public — they require authentication.
    @Autowired(required = false)
    private CustomJwtDecoder customJwtDecoder;

    @Autowired
    private CookieBearerTokenResolver cookieBearerTokenResolver;

    private final CustomOAuth2UserService customOAuth2UserService;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${app.rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${app.cors.allowed-origins:http://localhost:*}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity httpSecurity, Converter<Jwt, AbstractAuthenticationToken> jwtAuthConverter) throws Exception {

        HttpSecurity builder = httpSecurity
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny())
                        .contentTypeOptions(opt -> {})
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000))
                        .referrerPolicy(referrer -> referrer
                                .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .permissionsPolicy(perms -> perms
                                .policy("camera=(), microphone=(), geolocation=()")))
                .authorizeHttpRequests(req -> req
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .anyRequest().authenticated())

                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwtConfigurer -> {
                            jwtConfigurer.decoder(customJwtDecoder);
                            jwtConfigurer.jwtAuthenticationConverter(jwtAuthConverter);
                        })
                        .bearerTokenResolver(cookieBearerTokenResolver)
                        .authenticationEntryPoint(new JwtAuthenticationEntryPoint()));

        // Register rate limit filter (before auth) if enabled
        if (rateLimitEnabled) {
            builder.addFilterBefore(
                    new RateLimitFilter(redisTemplate, objectMapper),
                    UsernamePasswordAuthenticationFilter.class
            );
        }

        return builder.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(allowedOrigins);

        // Allow credentials (cookies)
        configuration.setAllowCredentials(true);

        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization", "Content-Type", "Accept", "Origin",
                "X-Requested-With", "Cache-Control", "ngrok-skip-browser-warning"));

        // Allow all methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // Expose headers for frontend
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));

        // Max age for preflight requests
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    DaoAuthenticationProvider daoAuthenticationProvider(CustomUserDetailsService userDetailsService,
                                                        PasswordEncoder passwordEncoder){
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter(
            RbacJwtAuthenticationConverter rbacConverter
    ) {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        // principal = sub
        converter.setPrincipalClaimName("sub");

        // dùng custom RBAC converter
        converter.setJwtGrantedAuthoritiesConverter(rbacConverter);

        return converter;
    }
}
