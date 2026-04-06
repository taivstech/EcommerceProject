package com.taivs.EcommerceWeb.config.integration;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class EmailConfig {

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.mail.from-name}")
    private String fromName;

    @Value("${app.email.verification.expiration-hours}")
    private int verificationExpirationHours;

    @Value("${app.email.verification.base-url}")
    private String baseUrl;

    @Value("${app.email.password-reset.expiration-minutes}")
    private int passwordResetExpirationMinutes;
}