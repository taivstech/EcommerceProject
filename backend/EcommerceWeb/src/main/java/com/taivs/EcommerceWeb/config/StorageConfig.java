package com.taivs.EcommerceWeb.config;

import com.taivs.EcommerceWeb.config.integration.AwsProperties;
import com.taivs.EcommerceWeb.config.integration.ImageKitProperties;
import com.taivs.EcommerceWeb.serviceimpl.media.AwsS3StorageService;
import com.taivs.EcommerceWeb.serviceimpl.media.ImageKitStorageService;
import com.taivs.EcommerceWeb.services.media.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
@Slf4j
public class StorageConfig {

    @Value("${storage.provider:s3}")
    private String storageProvider;

    @Bean
    @Primary
    public FileStorageService fileStorageService(
            AwsProperties awsProperties,
            ImageKitProperties imageKitProperties
    ) {
        log.info("Configuring active FileStorageService. Chosen provider: {}", storageProvider);
        if ("imagekit".equalsIgnoreCase(storageProvider)) {
            log.info("Initializing active storage provider: ImageKit");
            return new ImageKitStorageService(imageKitProperties);
        } else {
            log.info("Initializing active storage provider: AWS S3");
            AwsS3StorageService s3Service = new AwsS3StorageService(awsProperties);
            s3Service.init();
            return s3Service;
        }
    }
}
