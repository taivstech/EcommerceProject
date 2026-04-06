package com.taivs.EcommerceWeb.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import com.taivs.EcommerceWeb.utils.TokenIntrospector;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

import java.text.ParseException;

@Component
public class CustomJwtDecoder implements JwtDecoder {
    @Value("${jwt.signerKey}")
    private String signerKey;

    @Autowired
    private TokenIntrospector tokenIntrospector;

    @Override
    public Jwt decode(String token) throws JwtException {
        if (token == null || token.trim().isEmpty()) {
            throw new JwtException("Token is null or empty");
        }

        try {
            SignedJWT signedJWT = tokenIntrospector.verify(token);

            return new Jwt(
                    token,
                    signedJWT.getJWTClaimsSet().getIssueTime().toInstant(),
                    signedJWT.getJWTClaimsSet().getExpirationTime().toInstant(),
                    signedJWT.getHeader().toJSONObject(),
                    signedJWT.getJWTClaimsSet().getClaims());
        } catch (JOSEException | ParseException e) {
            throw new JwtException("Token verification failed: " + e.getMessage());
        } catch (Exception e) {
            throw new JwtException("Token invalid: " + e.getMessage());
        }
    }
}
