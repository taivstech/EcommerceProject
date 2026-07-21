package com.taivs.EcommerceWeb.config.integration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "aws")
@Getter
@Setter
public class AwsProperties {

    private S3 s3 = new S3();
    private Cloudfront cloudfront = new Cloudfront();

    @Getter
    @Setter
    public static class S3 {
        private String accessKey;
        private String secretKey;
        private String region = "us-east-1";
        private String bucketName;
    }

    @Getter
    @Setter
    public static class Cloudfront {
        private String domain;
        private String keyPairId;
        private String privateKeyPath;
    }
}
