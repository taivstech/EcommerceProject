package com.taivs.EcommerceWeb.services.auth;

import com.nimbusds.jose.JOSEException;
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
import com.taivs.EcommerceWeb.models.user.User;
import jakarta.servlet.http.HttpServletRequest;

import java.text.ParseException;
import java.util.Map;

public interface AuthenticationService {

    IntrospectResponse introspect(IntrospectRequest introspectRequest) throws ParseException, JOSEException;

    UserResponse createUser(UserCreationRequest request);

    AuthenticationTokens authenticate(AuthenticationRequest request);

    LogoutResponse logout(String accessToken, String refreshToken) throws ParseException, JOSEException;

    AuthenticationTokens refreshToken(String refreshToken, String accessToken) throws ParseException, JOSEException;

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    OutboundOAuthStateResponse issueOutboundOAuthState();

    Map<String, String> generateTokensForOAuth2(User user, HttpServletRequest httpRequest);

    AuthenticationTokens authenticateWithOAuth2Code(ExchangeTokenRequest request, HttpServletRequest httpRequest);
}
