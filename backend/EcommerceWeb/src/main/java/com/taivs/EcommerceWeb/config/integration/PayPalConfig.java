package com.taivs.EcommerceWeb.config.integration;

import com.paypal.sdk.Environment;
import com.paypal.sdk.PaypalServerSdkClient;
import com.paypal.sdk.authentication.ClientCredentialsAuthModel;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class PayPalConfig {
    @Value("${paypal.clientId}")
    private String clientId;

    @Value("${paypal.clientSecret}")
    private String clientSecret;

    @Value("${paypal.mode}")
    private String mode;

    @Value("${paypal.returnUrl}")
    private String returnUrl;

    @Value("${paypal.cancelUrl}")
    private String cancelUrl;

    @Bean
    public PaypalServerSdkClient paypalClient() {
        Environment env = "sandbox".equalsIgnoreCase(mode) ? Environment.SANDBOX : Environment.PRODUCTION;
        return new PaypalServerSdkClient.Builder()
                .clientCredentialsAuth(
                        new ClientCredentialsAuthModel.Builder(clientId, clientSecret).build()
                )
                .environment(env)
                .build();
    }
}
