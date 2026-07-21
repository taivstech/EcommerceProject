package com.taivs.EcommerceWeb.config.integration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.project-id:}")
    private String projectId;

    @Value("${firebase.client-email:}")
    private String clientEmail;

    @Value("${firebase.private-key:}")
    private String privateKey;

    @PostConstruct
    public void init() {
        try {
            if (projectId == null || projectId.isBlank() || "asdasdas".equals(projectId)) {
                log.warn("Firebase credentials are not set or dummy. Running Firebase Auth in MOCK/TEST mode.");
                return;
            }

            if (FirebaseApp.getApps().isEmpty()) {
                String cleanPrivateKey = privateKey.replace("\\n", "\n");
                String serviceAccountJson = String.format(
                        "{\n" +
                        "  \"type\": \"service_account\",\n" +
                        "  \"project_id\": \"%s\",\n" +
                        "  \"client_email\": \"%s\",\n" +
                        "  \"private_key\": \"%s\"\n" +
                        "}",
                        projectId, clientEmail, cleanPrivateKey
                );

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(
                                new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8))
                        ))
                        .build();

                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK successfully initialized for project: {}", projectId);
            }
        } catch (Exception e) {
            log.error("Failed to initialize Firebase Admin SDK. Verification will fallback to MOCK mode.", e);
        }
    }
}
