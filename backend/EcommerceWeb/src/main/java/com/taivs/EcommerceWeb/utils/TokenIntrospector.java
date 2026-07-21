package com.taivs.EcommerceWeb.utils;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import com.taivs.EcommerceWeb.dto.response.auth.IntrospectResponse;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.util.Date;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class TokenIntrospector {

    private final RedisTemplate<String, Object> redisTemplate;
    private final UserRepository userRepository;

    @Value("${jwt.signerKey}")
    private String signerKey;

    public IntrospectResponse introspect(String token) throws JOSEException, ParseException {
        boolean valid = true;
        String userId = null;
        try {
            SignedJWT signedJWT = verify(token);
            userId = signedJWT.getJWTClaimsSet().getSubject();
        } catch (AppException ex) {
            valid = false;
        }
        return IntrospectResponse.builder().userId(userId).valid(valid).build();
    }

    public SignedJWT verify(String token) throws ParseException, JOSEException {
        return verifyAndEnsureActive(token, true);
    }

    public SignedJWT verifyRefreshToken(String token) throws ParseException, JOSEException {
        return verifyAndEnsureActive(token, false);
    }

    private SignedJWT verifyAndEnsureActive(String token, boolean accessToken) throws JOSEException, ParseException {

        if (token == null || token.isBlank()){
            log.warn("Cannot find token");
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String tokenType = accessToken ? "access" : "refresh";
        String blacklistKey = "blacklist:" + tokenType + ":" + token;
        Object blacklisted = redisTemplate.opsForValue().get(blacklistKey);
        if (blacklisted != null){
            log.warn("Token is blacklisted");
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        JWSVerifier verifier = new MACVerifier(signerKey.getBytes(StandardCharsets.UTF_8));
        SignedJWT signedJWT = SignedJWT.parse(token);

        if (!JWSAlgorithm.HS512.equals(signedJWT.getHeader().getAlgorithm())) {
            log.warn("Token uses unexpected algorithm: {}", signedJWT.getHeader().getAlgorithm());
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        Date expiredTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        boolean verified = signedJWT.verify(verifier);

        if (!verified || expiredTime.before(new Date())) {
            log.warn("Token is invalid or expired");
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String userId = signedJWT.getJWTClaimsSet().getSubject();

        if (!accessToken) {
            String tokenKey = "refresh:" + userId;
            Boolean isMember = redisTemplate.opsForSet().isMember(tokenKey, token);
            if (isMember == null || !isMember) {
                log.warn("🚨 Security Alert: Used/Invalid Refresh Token detected for user {}! Revoking all sessions.", userId);
                redisTemplate.delete(tokenKey);
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }
        }

        Date tokenIssuedAt = signedJWT.getJWTClaimsSet().getIssueTime();
        Object passwordChangedAtObj = redisTemplate.opsForValue().get("pwd_changed:" + userId);

        if (passwordChangedAtObj != null) {
            try {
                long passwordChangedAt = Long.parseLong(passwordChangedAtObj.toString());
                long tokenIssuedAtMs = tokenIssuedAt.getTime();

                if (tokenIssuedAtMs < passwordChangedAt) {
                    log.warn("Token issued before password change - invalidating token for userId: {}", userId);
                    throw new AppException(ErrorCode.UNAUTHENTICATED);
                }
            } catch (NumberFormatException e) {
                log.error("Invalid password change timestamp format for userId: {}", userId);
            }
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.warn("Token verification failed: user not found for userId: {}", userId);
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        User user = userOpt.get();
        if (!Boolean.TRUE.equals(user.getActive())) {
            log.warn("Token verification failed: user is not active for userId: {}", userId);
            throw new AppException(ErrorCode.USER_NOT_ACTIVE);
        }

        log.debug("Token verified successfully for userId: {}", userId);
        return signedJWT;
    }
}
