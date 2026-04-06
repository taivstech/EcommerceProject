package com.taivs.EcommerceWeb.security;


import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.auth.UserIdentity;
import com.taivs.EcommerceWeb.enums.auth.AuthProviderType;
import com.taivs.EcommerceWeb.repositories.auth.UserIdentityRepository;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final UserIdentityRepository userIdentityRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        String providerId = userRequest.getClientRegistration().getRegistrationId();
        String providerUserId = oauth2User.getAttribute("sub");
        String email = oauth2User.getAttribute("email");
        String fullName = oauth2User.getAttribute("name");
        String picture = oauth2User.getAttribute("picture");

        log.info("OAuth2 login attempt - Provider: {}, Email: {}, ProviderUserId: {}", 
                 providerId, email, providerUserId);

        AuthProviderType providerType = AuthProviderType.valueOf(providerId.toUpperCase());

        Optional<UserIdentity> existingIdentity =
            userIdentityRepository.findByProviderAndProviderUserId(providerType, providerUserId);

        User user;
        UserIdentity userIdentity;

        if (existingIdentity.isPresent()) {

            userIdentity = existingIdentity.get();
            user = userIdentity.getUser();
            
            log.info("Existing OAuth2 user found: userId={}, username={}", 
                     user.getId(), user.getUsername());

            updateUserInfo(user, email, fullName, picture);
            userRepository.save(user);

        } else {

            String mode = getOAuth2Mode();
            log.info("OAuth2 mode: {}", mode);

            Optional<User> existingUser = userRepository.findByEmail(email);

            if (existingUser.isPresent()) {
                user = existingUser.get();
                log.info("Linking {} account to existing user: userId={}, email={}", 
                         providerId, user.getId(), email);

                updateUserInfo(user, email, fullName, picture);
                userRepository.save(user);

                userIdentity = createUserIdentity(user, providerType, providerUserId, email);

            } else {
                
                if ("login".equalsIgnoreCase(mode)) {
                    log.error("OAuth2 login failed - no account found for email: {}", email);
                    throw new OAuth2AuthenticationException(
                        new OAuth2Error("user_not_found", 
                                       "No account found for this email. Please register first.", 
                                       null));
                }

                user = createNewUser(email, fullName, picture);
                user = userRepository.save(user);
                
                log.info("Created new user from OAuth2: userId={}, email={}", 
                         user.getId(), email);

                userIdentity = createUserIdentity(user, providerType, providerUserId, email);
            }
        }

        return new CustomOAuth2User(oauth2User, user);
    }


    private void updateUserInfo(User user, String email, String fullName, String picture) {
        if (email != null && !email.equals(user.getEmail())) {
            user.setEmail(email);
        }
        if (fullName != null && (user.getFullName() == null || user.getFullName().isBlank())) {
            user.setFullName(fullName);
        }
        if (picture != null && (user.getProfilePicture() == null || user.getProfilePicture().isBlank())) {
            user.setProfilePicture(picture);
        }
    }


    private User createNewUser(String email, String fullName, String picture) {
        User user = new User();
        

        String baseUsername = email.split("@")[0];
        String username = generateUniqueUsername(baseUsername);
        
        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setProfilePicture(picture);
        user.setActive(true);

        user.setPassword(null);
        
        return user;
    }


    private String generateUniqueUsername(String baseUsername) {
        String username = baseUsername;
        int suffix = 1;
        
        while (userRepository.findByUsername(username).isPresent()) {
            username = baseUsername + suffix;
            suffix++;
        }
        
        return username;
    }

    private UserIdentity createUserIdentity(User user, AuthProviderType provider, 
                                           String providerUserId, String providerEmail) {
        UserIdentity userIdentity = new UserIdentity();
        userIdentity.setUser(user);
        userIdentity.setProvider(provider);
        userIdentity.setProviderUserId(providerUserId);
        userIdentity.setProviderEmail(providerEmail);
        userIdentity.setLinkedAt(Instant.now());
        
        return userIdentityRepository.save(userIdentity);
    }

    private String getOAuth2Mode() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpSession session = attributes.getRequest().getSession(false);
                if (session != null) {
                    String mode = (String) session.getAttribute("oauth2_mode");
                    if (mode != null) {
                        return mode;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error getting OAuth2 mode from session", e);
        }

        return "login";
    }
}

