package com.taivs.EcommerceWeb.serviceimpl.auth;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.taivs.EcommerceWeb.dto.request.auth.AuthenticationRequest;
import com.taivs.EcommerceWeb.dto.request.auth.ExchangeTokenRequest;
import com.taivs.EcommerceWeb.dto.request.auth.ForgotPasswordRequest;
import com.taivs.EcommerceWeb.dto.request.auth.IntrospectRequest;
import com.taivs.EcommerceWeb.dto.request.auth.ResetPasswordRequest;
import com.taivs.EcommerceWeb.dto.request.user.UserCreationRequest;
import com.taivs.EcommerceWeb.dto.response.auth.AuthenticationTokens;
import com.taivs.EcommerceWeb.dto.response.auth.IntrospectResponse;
import com.taivs.EcommerceWeb.dto.response.auth.LogoutResponse;
import com.taivs.EcommerceWeb.dto.response.auth.OutboundOAuthStateResponse;
import com.taivs.EcommerceWeb.dto.response.user.UserResponse;
import com.taivs.EcommerceWeb.models.auth.Role;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.auth.UserIdentity;
import com.taivs.EcommerceWeb.models.auth.UserRole;
import com.taivs.EcommerceWeb.models.auth.UserRoleId;
import com.taivs.EcommerceWeb.enums.auth.AuthProviderType;
import com.taivs.EcommerceWeb.mappers.user.UserMapper;
import com.taivs.EcommerceWeb.repositories.auth.RoleRepository;
import com.taivs.EcommerceWeb.repositories.auth.UserIdentityRepository;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.repositories.auth.UserRoleRepository;
import com.taivs.EcommerceWeb.services.auth.AuthenticationService;
import com.taivs.EcommerceWeb.utils.EmailService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import com.taivs.EcommerceWeb.utils.TokenIntrospector;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final UserMapper userMapper;
    private final TokenIntrospector tokenIntrospector;
    private final AuthenticationManager authenticationManager;
    private final UserIdentityRepository userIdentityRepository;
    private final UserRoleRepository userRoleRepository;

    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    @Value("${jwt.access-token-expiration-minutes}")
    protected long ACCESS_TOKEN_EXPIRATION_MINUTES;

    @Value("${jwt.refresh-token-expiration-days}")
    protected long REFRESH_TOKEN_EXPIRATION_DAYS;

    @Value("${app.email.password-reset.expiration-minutes:30}")
    protected long passwordResetExpirationMinutes;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    protected String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    protected String googleClientSecret;

    @Value("${app.auth.outbound-redirect-uri:https://ecommerce.pro.vn/authenticate}")
    protected String frontendRedirectUri;

    @Value("${oauth2.state-signer-key:${jwt.signerKey}}")
    protected String OAUTH2_STATE_SIGNER_KEY;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final long OUTBOUND_STATE_TTL_SECONDS = 10 * 60;
    private static final String OUTBOUND_STATE_KEY_PREFIX = "oauth2_state:";

    private static final String GOOGLE_ISSUER_1 = "https://accounts.google.com";
    private static final String GOOGLE_ISSUER_2 = "accounts.google.com";
    private static final String GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
    private static final long GOOGLE_JWKS_CACHE_MS = 6 * 60 * 60 * 1000L;
    private volatile JWKSet googleJwkSet;
    private volatile long googleJwkSetFetchedAtMs = 0L;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public IntrospectResponse introspect(IntrospectRequest introspectRequest) throws ParseException, JOSEException {
        return tokenIntrospector.introspect(introspectRequest.getToken());
    }

    @Override
    @Transactional
    public UserResponse createUser(UserCreationRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }
        if (request.getPassword() == null || !request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);
        }

        Set<Role> roles = new HashSet<>();
        roleRepository.findByName("USER").ifPresent(roles::add);

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .dob(request.getDob())
                .active(true)
                .emailVerified(false)
                .build();
        User saved = userRepository.save(user);

        for (Role role : roles) {
            UserRoleId id = new UserRoleId(saved.getId(), role.getId());

            UserRole userRole = UserRole.builder()
                    .id(id)
                    .user(saved)
                    .role(role)
                    .assignedAt(Instant.now())
                    .build();

            saved.getUserRoles().add(userRole);
        }

        userRepository.save(saved);

        setPasswordChangeTimestamp(saved.getId());

        // Send email verification instead of welcome email
        if (saved.getEmail() != null && !saved.getEmail().isBlank()) {
            sendEmailVerification(saved);
        }

        return userMapper.toUserResponse(saved);
    }

    @Override
    @Transactional
    public AuthenticationTokens authenticate(AuthenticationRequest request) {
        String identifier = request.getEmailOrPhone();

        if (identifier == null || identifier.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        final String normalizedIdentifier = identifier.trim();

        if (normalizedIdentifier.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        final String searchIdentifier = normalizedIdentifier;
        var user = userRepository.findByEmailOrPhoneWithRoles(searchIdentifier)
                .or(() -> userRepository.findByUsernameWithRoles(searchIdentifier))
                .orElseThrow(() -> {
                    log.warn("Login failed: No user found for identifier: {}", searchIdentifier);
                    return new AppException(ErrorCode.USER_NOT_EXISTED);
                });

        log.info("Login attempt: identifier={}, userId={}, active={}, passwordSet={}, passwordLen={}",
                identifier,
                user.getId(),
                Boolean.TRUE.equals(user.getActive()),
                user.getPassword() != null && !user.getPassword().isBlank(),
                user.getPassword() != null ? user.getPassword().length() : 0);

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new AppException(ErrorCode.USER_NOT_ACTIVE);
        }

        String usernameForAuth = user.getUsername();
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(usernameForAuth, request.getPassword()));
        } catch (org.springframework.security.authentication.BadCredentialsException ex) {
            throw new AppException(ErrorCode.WRONG_PASSWORD);
        } catch (AuthenticationException ex) {
            ex.printStackTrace();
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        Map<String, String> tokens = generateTokens(user);
        persistSessionTokens(user.getId(), tokens.get("accessToken"), tokens.get("refreshToken"));

        return AuthenticationTokens.builder()
                .accessToken(tokens.get("accessToken"))
                .refreshToken(tokens.get("refreshToken"))
                .authenticated(true)
                .build();
    }

    @Override
    public LogoutResponse logout(String accessToken, String refreshToken)
            throws ParseException, JOSEException {

        SignedJWT access = tokenIntrospector.verify(accessToken);
        String userId = access.getJWTClaimsSet().getSubject();

        blacklistToken(accessToken, "access",
                access.getJWTClaimsSet().getExpirationTime());

        if (refreshToken != null && !refreshToken.isBlank()) {
            try {
                SignedJWT refresh = tokenIntrospector.verifyRefreshToken(refreshToken);
                String refreshUserId = refresh.getJWTClaimsSet().getSubject();

                if (!userId.equals(refreshUserId)) {
                    throw new AppException(ErrorCode.UNAUTHENTICATED);
                }

                blacklistToken(refreshToken, "refresh",
                        refresh.getJWTClaimsSet().getExpirationTime());

                String refreshKey = "refresh:" + userId;
                redisTemplate.opsForSet().remove(refreshKey, refreshToken);

            } catch (Exception e) {
                log.warn("Failed to verify refresh token during logout for userId {}", userId, e);
            }
        }

        return new LogoutResponse(true, "Logout successful");
    }

    @Override
    @Transactional(readOnly = true)
    public AuthenticationTokens refreshToken(String refreshToken, String accessToken) throws ParseException, JOSEException {
        SignedJWT refreshJwt = tokenIntrospector.verifyRefreshToken(refreshToken);
        String userId = refreshJwt.getJWTClaimsSet().getSubject();

        if (accessToken != null && !accessToken.isBlank()) {
            try {
                SignedJWT accessJwt = SignedJWT.parse(accessToken);
                String accessUserId = accessJwt.getJWTClaimsSet().getSubject();

                if (!userId.equals(accessUserId)) {
                    throw new AppException(ErrorCode.UNAUTHENTICATED);
                }

                Date expiryTime = accessJwt.getJWTClaimsSet().getExpirationTime();
                blacklistToken(accessToken, "access", expiryTime);
            } catch (Exception e) {
                log.warn("Failed to blacklist old access token during refresh for userId {}", userId, e);
            }
        }

        blacklistToken(refreshToken, "refresh", refreshJwt.getJWTClaimsSet().getExpirationTime());

        String refreshKey = "refresh:" + userId;
        redisTemplate.opsForSet().remove(refreshKey, refreshToken);

        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new AppException(ErrorCode.USER_NOT_ACTIVE);
        }

        Map<String, String> tokens = generateTokens(user);
        persistSessionTokens(user.getId(), tokens.get("accessToken"), tokens.get("refreshToken"));

        return AuthenticationTokens.builder()
                .accessToken(tokens.get("accessToken"))
                .refreshToken(tokens.get("refreshToken"))
                .authenticated(true)
                .build();
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        String rawToken = UUID.randomUUID().toString();
        String hashedToken = hashToken(rawToken);

        String key = "pwd_reset:" + hashedToken;

        redisTemplate.opsForValue().set(
                key,
                user.getId().toString(),
                passwordResetExpirationMinutes,
                TimeUnit.MINUTES
        );

        emailService.sendPasswordResetEmail(
                user.getEmail(),
                user.getUsername(),
                rawToken
        );
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {

        if (request.getToken() == null || request.getToken().isBlank()) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);
        }

        String hashedToken = hashToken(request.getToken());
        String key = "pwd_reset:" + hashedToken;

        Object userIdObj = redisTemplate.opsForValue().get(key);
        if (userIdObj == null) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }

        String userId = userIdObj.toString();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        redisTemplate.delete(key);

        redisTemplate.delete("refresh:" + userId);

        redisTemplate.opsForValue().set(
                "pwd_changed:" + userId,
                String.valueOf(System.currentTimeMillis()),
                30,
                TimeUnit.DAYS
        );
    }

    @Override
    public OutboundOAuthStateResponse issueOutboundOAuthState() {
        byte[] stateBytes = new byte[32];
        SECURE_RANDOM.nextBytes(stateBytes);
        String state = base64Url(stateBytes);
        String signature = signState(state);

        String key = OUTBOUND_STATE_KEY_PREFIX + state;
        redisTemplate.opsForValue().set(key, "1", OUTBOUND_STATE_TTL_SECONDS, TimeUnit.SECONDS);

        log.info("OAuth state issued - state: {}, signature: {}, key: {}, TTL: {}s",
                state, signature, key, OUTBOUND_STATE_TTL_SECONDS);

        return OutboundOAuthStateResponse.builder()
                .state(state)
                .stateSignature(signature)
                .expiresInSeconds(OUTBOUND_STATE_TTL_SECONDS)
                .build();
    }

    @Override
    public Map<String, String> generateTokensForOAuth2(User user, HttpServletRequest httpRequest) {
        return generateTokens(user);
    }

    @Override
    @Transactional
    public AuthenticationTokens authenticateWithOAuth2Code(ExchangeTokenRequest request, HttpServletRequest httpRequest) {
        try {
            verifyOutboundStateOrThrow(request);
            if (request.getCodeVerifier() == null || request.getCodeVerifier().isBlank()) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }

            Map<String, Object> tokenResp = exchangeCodeForTokens(request);
            String idToken = tokenResp == null ? null : (String) tokenResp.get("id_token");
            if (idToken == null || idToken.isBlank()) {
                throw new AppException(ErrorCode.OAUTH2_AUTHENTICATION_FAILED);
            }

            JWTClaimsSet claims = verifyGoogleIdToken(idToken);
            String googleId = claims.getSubject();
            String email = asString(claims.getClaim("email"));
            String name = asString(claims.getClaim("name"));
            String picture = asString(claims.getClaim("picture"));

            if (googleId == null || googleId.isBlank()) throw new AppException(ErrorCode.OAUTH2_AUTHENTICATION_FAILED);

            User user = findOrCreateOAuthUser(googleId, email, name, picture);

            Map<String, String> tokens = generateTokens(user);
            persistSessionTokens(user.getId(), tokens.get("accessToken"), tokens.get("refreshToken"));

            consumeOutboundState(request.getState());

            return AuthenticationTokens.builder()
                    .accessToken(tokens.get("accessToken"))
                    .refreshToken(tokens.get("refreshToken"))
                    .authenticated(true)
                    .build();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("OAuth2 code exchange failed", e);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    private void persistSessionTokens(String userId, String accessToken, String refreshToken) {
        String refreshKey = "refresh:" + userId;
        if (refreshToken != null && !refreshToken.isBlank()) {
            redisTemplate.opsForSet().add(refreshKey, refreshToken);
            redisTemplate.expire(refreshKey, REFRESH_TOKEN_EXPIRATION_DAYS, TimeUnit.DAYS);
        }
    }

    private Map<String, String> generateTokens(User user) {
        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", generateToken(user, ACCESS_TOKEN_EXPIRATION_MINUTES, ChronoUnit.MINUTES));
        tokens.put("refreshToken", generateToken(user, REFRESH_TOKEN_EXPIRATION_DAYS, ChronoUnit.DAYS));
        return tokens;
    }

    private void setPasswordChangeTimestamp(String userId) {
        redisTemplate.opsForValue().set("pwd_changed:" + userId, String.valueOf(System.currentTimeMillis()), 30, TimeUnit.DAYS);
    }

    private String generateToken(User user, long duration, ChronoUnit unit) {
        try {
            JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
            Instant now = Instant.now();

            Date issueTime = Date.from(now);
            Date expiryTime = Date.from(now.plus(duration, unit));

            String scope = buildScope(user);

            JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                    .subject(user.getId().toString())
                    .issuer("taivs93.com")
                    .issueTime(issueTime)
                    .expirationTime(expiryTime)
                    .jwtID(UUID.randomUUID().toString())
                    .claim("scope", scope)
                    .build();

            SignedJWT signedJWT = new SignedJWT(header, jwtClaimsSet);
            JWSSigner signer = new MACSigner(SIGNER_KEY.getBytes());
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (Exception e) {
            log.error("Error generating token", e);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    private String buildScope(User user) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            return "ROLE_USER";
        }

        Set<String> scopes = new HashSet<>();
        for (Role role : user.getRoles()) {
            scopes.add("ROLE_" + role.getName());
            if (role.getPermissions() != null) {
                role.getPermissions().forEach(permission -> scopes.add(permission.getName()));
            }
        }
        return String.join(" ", scopes);
    }

    private void blacklistToken(String token, String tokenType, Date expiryTime) {
        if (token == null || token.isBlank() || expiryTime == null) return;
        long remainingMs = expiryTime.getTime() - System.currentTimeMillis();
        if (remainingMs <= 0) return;

        String blacklistKey = "blacklist:" + tokenType + ":" + token;
        redisTemplate.opsForValue().set(blacklistKey, "revoked", remainingMs, TimeUnit.MILLISECONDS);
    }

    private Map<String, Object> exchangeCodeForTokens(ExchangeTokenRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String redirectUri = frontendRedirectUri;
        if (request.getRedirectUri() != null && !request.getRedirectUri().isBlank()) {
            redirectUri = request.getRedirectUri().trim();
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", request.getCode());
        form.add("client_id", googleClientId);
        form.add("client_secret", googleClientSecret);
        form.add("redirect_uri", redirectUri);
        form.add("grant_type", "authorization_code");
        form.add("code_verifier", request.getCodeVerifier());

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(form, headers);

        @SuppressWarnings("unchecked")
        Map<String, Object> resp = (Map<String, Object>) (Map<?, ?>) restTemplate.postForObject(
                "https://oauth2.googleapis.com/token", entity, Map.class);
        return resp;
    }

    private void verifyOutboundStateOrThrow(ExchangeTokenRequest request) {
        if (request == null) throw new AppException(ErrorCode.INVALID_REQUEST);
        String state = request.getState();
        String signature = request.getStateSignature();

        log.info("OAuth state verification - state: {}, signature: {}", state, signature);

        if (state == null || state.isBlank() || signature == null || signature.isBlank()) {
            log.error("OAuth state or signature is null/blank");
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        String expected = signState(state);
        log.info("OAuth signature verification - expected: {}, received: {}", expected, signature);

        if (!MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                signature.getBytes(StandardCharsets.UTF_8))) {
            log.error("OAuth state signature mismatch. Expected: {}, Received: {}", expected, signature);
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }

        String redisKey = OUTBOUND_STATE_KEY_PREFIX + state;
        Object exists = redisTemplate.opsForValue().get(redisKey);
        log.info("OAuth Redis check - key: {}, exists: {}", redisKey, exists);

        if (exists == null) {
            log.error("OAuth state not found in Redis or expired. Key: {}", redisKey);
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }
    }

    private void consumeOutboundState(String state) {
        if (state == null || state.isBlank()) return;
        redisTemplate.delete(OUTBOUND_STATE_KEY_PREFIX + state);
    }

    private String signState(String state) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(OAUTH2_STATE_SIGNER_KEY.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] sig = mac.doFinal(state.getBytes(StandardCharsets.UTF_8));
            return base64Url(sig);
        } catch (Exception e) {
            log.error("Failed to sign OAuth2 state", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String asString(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    private JWTClaimsSet verifyGoogleIdToken(String idToken) {
        try {
            SignedJWT jwt = SignedJWT.parse(idToken);
            String kid = jwt.getHeader().getKeyID();
            JWKSet jwkSet = getGoogleJwkSet(false);
            JWK jwk = kid == null ? null : jwkSet.getKeyByKeyId(kid);
            if (jwk == null) {
                jwkSet = getGoogleJwkSet(true);
                jwk = kid == null ? null : jwkSet.getKeyByKeyId(kid);
            }
            if (!(jwk instanceof RSAKey rsaKey)) {
                throw new AppException(ErrorCode.OAUTH2_AUTHENTICATION_FAILED);
            }

            JWSVerifier verifier = new RSASSAVerifier(rsaKey.toRSAPublicKey());
            if (!jwt.verify(verifier)) {
                throw new AppException(ErrorCode.OAUTH2_AUTHENTICATION_FAILED);
            }

            JWTClaimsSet claims = jwt.getJWTClaimsSet();
            Date exp = claims.getExpirationTime();
            if (exp == null || exp.before(new Date())) {
                throw new AppException(ErrorCode.OAUTH2_AUTHENTICATION_FAILED);
            }

            String iss = claims.getIssuer();
            if (!(GOOGLE_ISSUER_1.equals(iss) || GOOGLE_ISSUER_2.equals(iss))) {
                throw new AppException(ErrorCode.OAUTH2_AUTHENTICATION_FAILED);
            }

            List<String> aud = claims.getAudience();
            if (aud == null || !aud.contains(googleClientId)) {
                throw new AppException(ErrorCode.OAUTH2_AUTHENTICATION_FAILED);
            }

            if (claims.getSubject() == null || claims.getSubject().isBlank()) {
                throw new AppException(ErrorCode.OAUTH2_AUTHENTICATION_FAILED);
            }

            return claims;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Google id_token verification failed", e);
            throw new AppException(ErrorCode.OAUTH2_AUTHENTICATION_FAILED);
        }
    }

    private JWKSet getGoogleJwkSet(boolean forceRefresh) {
        long now = System.currentTimeMillis();
        if (!forceRefresh && googleJwkSet != null && (now - googleJwkSetFetchedAtMs) < GOOGLE_JWKS_CACHE_MS) {
            return googleJwkSet;
        }

        synchronized (this) {
            now = System.currentTimeMillis();
            if (!forceRefresh && googleJwkSet != null && (now - googleJwkSetFetchedAtMs) < GOOGLE_JWKS_CACHE_MS) {
                return googleJwkSet;
            }
            try {
                String json = restTemplate.getForObject(GOOGLE_JWKS_URL, String.class);
                if (json == null || json.isBlank()) {
                    throw new AppException(ErrorCode.OAUTH2_AUTHENTICATION_FAILED);
                }
                googleJwkSet = JWKSet.parse(json);
                googleJwkSetFetchedAtMs = now;
                return googleJwkSet;
            } catch (AppException e) {
                throw e;
            } catch (Exception e) {
                log.warn("Failed to fetch Google JWKS", e);
                throw new AppException(ErrorCode.OAUTH2_AUTHENTICATION_FAILED);
            }
        }
    }

    @Transactional
    private User findOrCreateOAuthUser(String googleId, String email, String name, String picture) {
        Optional<UserIdentity> existing = userIdentityRepository.findByProviderAndProviderUserId(AuthProviderType.GOOGLE, googleId);
        if (existing.isPresent()) {
            User user = existing.get().getUser();
            user = userRepository.findByIdWithRoles(user.getId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
            updateOAuthProfileIfNeeded(user, name, picture, email);
            return userRepository.save(user);
        }

        if (email != null) {
            Optional<User> byEmail = userRepository.findByEmailWithRoles(email);
            if (byEmail.isPresent()) {
                User user = byEmail.get();
                updateOAuthProfileIfNeeded(user, name, picture, email);
                User saved = userRepository.save(user);
                createUserIdentity(saved, AuthProviderType.GOOGLE, googleId, email);
                return saved;
            }
        }
        Set<Role> roles = new HashSet<>();
        roleRepository.findByName("USER").ifPresent(roles::add);

        User user = User.builder()
                .username(generateUsernameFromEmailOrId(email, googleId))
                .email(email)
                .fullName(name)
                .profilePicture(picture)
                .password(null)
                .active(true)
                .emailVerified(true)  // Google already verified the email
                .build();
        User saved = userRepository.save(user);
        log.info(saved.toString());
        Set<UserRole> userRoles = roles.stream().map(role -> userRoleRepository.save(UserRole.builder().user(saved)
                .role(role)
                .assignedAt(Instant.now())
                .build())).collect(Collectors.toSet());
        saved.setUserRoles(userRoles);
        userRepository.save(user);

        // Associate Google OAuth identity with the new user
        createUserIdentity(saved, AuthProviderType.GOOGLE, googleId, email);

        if (saved.getEmail() != null && !saved.getEmail().isBlank()) {
            emailService.sendWelcomeEmail(saved.getEmail(), saved.getUsername());
        }

        return saved;
    }

    private void updateOAuthProfileIfNeeded(User user, String fullName, String picture, String email) {
        if (fullName != null && (user.getFullName() == null || user.getFullName().isBlank())) {
            user.setFullName(fullName);
        }
        if (picture != null && (user.getProfilePicture() == null || user.getProfilePicture().isBlank())) {
            user.setProfilePicture(picture);
        }
        if (email != null && (user.getEmail() == null || user.getEmail().isBlank())) {
            user.setEmail(email);
        }
    }

    private String generateUsernameFromEmailOrId(String email, String providerUserId) {
        if (email != null && email.contains("@")) {
            String base = email.substring(0, email.indexOf("@"));
            return base.length() > 3 ? base : base + "_" + providerUserId.substring(0, 6);
        }
        return "user_" + providerUserId.substring(0, 8);
    }

    private UserIdentity createUserIdentity(User user, AuthProviderType provider, String providerUserId, String providerEmail) {
        UserIdentity userIdentity = new UserIdentity();
        userIdentity.setUser(user);
        userIdentity.setProvider(provider);
        userIdentity.setProviderUserId(providerUserId);
        userIdentity.setProviderEmail(providerEmail);
        userIdentity.setLinkedAt(Instant.now());
        return userIdentityRepository.save(userIdentity);
    }

    // ─── New methods ──────────────────────────────────────────────────────────────

    @Override
    public boolean checkUsernameAvailable(String username) {
        if (username == null || username.isBlank()) return false;
        return !userRepository.existsByUsername(username.trim());
    }

    @Override
    public boolean checkEmailAvailable(String email) {
        if (email == null || email.isBlank()) return false;
        return !userRepository.existsByEmail(email.trim());
    }

    @Override
    @Transactional
    public AuthenticationTokens verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }

        String hashedToken = hashToken(token);
        String key = "email_verify:" + hashedToken;

        Object userIdObj = redisTemplate.opsForValue().get(key);
        if (userIdObj == null) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }

        String userId = userIdObj.toString();
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        user.setEmailVerified(true);
        userRepository.save(user);
        redisTemplate.delete(key);

        log.info("Email verified for userId: {}", userId);

        // Auto-login: return JWT tokens
        Map<String, String> tokens = generateTokens(user);
        persistSessionTokens(user.getId(), tokens.get("accessToken"), tokens.get("refreshToken"));

        return AuthenticationTokens.builder()
                .accessToken(tokens.get("accessToken"))
                .refreshToken(tokens.get("refreshToken"))
                .authenticated(true)
                .build();
    }

    private void sendEmailVerification(User user) {
        String rawToken = UUID.randomUUID().toString();
        String hashedToken = hashToken(rawToken);
        String key = "email_verify:" + hashedToken;

        // Token valid for 24 hours
        redisTemplate.opsForValue().set(key, user.getId(), 24, TimeUnit.HOURS);

        emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), rawToken);
    }
}
