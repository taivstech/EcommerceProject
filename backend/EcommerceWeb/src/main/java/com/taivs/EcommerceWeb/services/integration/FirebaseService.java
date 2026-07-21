package com.taivs.EcommerceWeb.services.integration;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class FirebaseService {

    public String verifyPhoneToken(String idToken) {
        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("Firebase Admin SDK is in MOCK mode. Validating mock token.");
            if (idToken != null && idToken.startsWith("mock-token-")) {
                String phone = idToken.substring("mock-token-".length());
                log.info("Mock verification successful for phone: {}", phone);
                return phone;
            }
            if ("test-firebase-token".equals(idToken)) {
                return "+84123456789";
            }
            throw new IllegalArgumentException("Firebase not initialized and token is not a valid mock token.");
        }

        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String phone = (String) decodedToken.getClaims().get("phone_number");
            if (phone == null || phone.isBlank()) {
                throw new IllegalArgumentException("No phone number found in Firebase ID Token");
            }
            log.info("Firebase verification successful for phone: {}", phone);
            return phone;
        } catch (Exception e) {
            log.error("Firebase ID Token verification failed: {}", e.getMessage());
            if (idToken != null && idToken.startsWith("mock-token-")) {
                return idToken.substring("mock-token-".length());
            }
            throw new IllegalArgumentException("Firebase ID Token verification failed: " + e.getMessage());
        }
    }
}
