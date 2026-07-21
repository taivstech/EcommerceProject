package com.taivs.EcommerceWeb.serviceimpl.media;

import com.taivs.EcommerceWeb.config.integration.AwsProperties;
import com.taivs.EcommerceWeb.services.media.FileStorageService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudfront.CloudFrontUtilities;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RequiredArgsConstructor
@Slf4j
public class AwsS3StorageService implements FileStorageService {

    private final AwsProperties awsProperties;
    private S3Client s3Client;
    private S3Presigner s3Presigner;
    private boolean isMock = true;

    @PostConstruct
    public void init() {
        var s3 = awsProperties.getS3();
        if (s3.getAccessKey() != null && !s3.getAccessKey().isBlank() &&
            s3.getBucketName() != null && !s3.getBucketName().isBlank() &&
            !"asdasdas".equals(s3.getAccessKey())) {
            try {
                AwsBasicCredentials credentials = AwsBasicCredentials.create(s3.getAccessKey(), s3.getSecretKey());
                s3Client = S3Client.builder()
                        .credentialsProvider(StaticCredentialsProvider.create(credentials))
                        .region(Region.of(s3.getRegion()))
                        .build();

                s3Presigner = S3Presigner.builder()
                        .credentialsProvider(StaticCredentialsProvider.create(credentials))
                        .region(Region.of(s3.getRegion()))
                        .build();

                isMock = false;
                log.info("AWS S3 Storage Service successfully initialized for bucket: {}", s3.getBucketName());
            } catch (Exception e) {
                log.error("Failed to initialize AWS S3 client. Running in MOCK storage mode: {}", e.getMessage());
                isMock = true;
            }
        } else {
            log.warn("AWS S3 credentials or bucket not set. Running in MOCK storage mode.");
            isMock = true;
        }
    }

    @Override
    public Map<String, String> upload(MultipartFile file, String folder) {
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String cleanOriginalName = originalName.replaceAll("[^a-zA-Z0-9.-]", "_");
        String key = (folder != null && !folder.isBlank() ? folder.trim() + "/" : "")
                + UUID.randomUUID().toString() + "_" + cleanOriginalName;

        log.info("Uploading file to S3: key={}", key);

        if (isMock) {
            log.warn("MOCK upload successful: returning mock URL for key: {}", key);
            String mockUrl = "https://dummy-s3-bucket.s3.amazonaws.com/" + key;
            return Map.of(
                    "url", mockUrl,
                    "fileId", key,
                    "thumbnailUrl", mockUrl
            );
        }

        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(awsProperties.getS3().getBucketName())
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            String url = generateUrl(key);

            log.info("Upload successful for S3 key: {}", key);
            return Map.of(
                    "url", url,
                    "fileId", key,
                    "thumbnailUrl", url
            );
        } catch (Exception e) {
            log.error("S3 upload failed for key {}: {}", key, e.getMessage(), e);
            throw new RuntimeException("S3 file upload failed: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String fileId) {
        log.info("Deleting file from S3: fileId={}", fileId);
        if (isMock) {
            log.warn("MOCK delete successful for key: {}", fileId);
            return;
        }

        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(awsProperties.getS3().getBucketName())
                    .key(fileId)
                    .build();

            s3Client.deleteObject(deleteRequest);
            log.info("S3 deletion successful for key: {}", fileId);
        } catch (Exception e) {
            log.error("S3 delete failed for key {}: {}", fileId, e.getMessage(), e);
            throw new RuntimeException("S3 file delete failed: " + e.getMessage(), e);
        }
    }

    private String generateUrl(String key) {
        if (isMock) {
            return "https://dummy-s3-bucket.s3.amazonaws.com/" + key;
        }

        var cf = awsProperties.getCloudfront();
        if (cf.getDomain() != null && !cf.getDomain().isBlank() &&
            cf.getKeyPairId() != null && !cf.getKeyPairId().isBlank() &&
            cf.getPrivateKeyPath() != null && !cf.getPrivateKeyPath().isBlank()) {
            try {
                String resourceUrl = cf.getDomain();
                if (!resourceUrl.endsWith("/")) {
                    resourceUrl += "/";
                }
                resourceUrl += key;

                java.nio.file.Path keyPath = java.nio.file.Paths.get(cf.getPrivateKeyPath());
                Instant expiration = Instant.now().plus(Duration.ofHours(2));

                return CloudFrontUtilities.create().getSignedUrlWithCannedPolicy(
                        r -> r.resourceUrl(resourceUrl)
                                .keyPairId(cf.getKeyPairId())
                                .privateKey(keyPath)
                                .expirationDate(expiration)
                );
            } catch (Exception e) {
                log.error("Failed to generate CloudFront signed URL, falling back to S3 Presigned URL: {}", e.getMessage());
            }
        }

        try {
            GetObjectRequest getRequest = GetObjectRequest.builder()
                    .bucket(awsProperties.getS3().getBucketName())
                    .key(key)
                    .build();
            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofHours(2))
                    .getObjectRequest(getRequest)
                    .build();
            return s3Presigner.presignGetObject(presignRequest).url().toString();
        } catch (Exception e) {
            log.error("Failed to generate S3 Presigned URL, returning raw public S3 URL: {}", e.getMessage());
            String region = awsProperties.getS3().getRegion();
            return String.format("https://%s.s3.%s.amazonaws.com/%s",
                    awsProperties.getS3().getBucketName(), region, key);
        }
    }

    @Override
    public Map<String, String> generatePresignedUploadUrl(String folder, String filename, String contentType) {
        String cleanOriginalName = filename.replaceAll("[^a-zA-Z0-9.-]", "_");
        String key = (folder != null && !folder.isBlank() ? folder.trim() + "/" : "")
                + UUID.randomUUID().toString() + "_" + cleanOriginalName;

        log.info("Generating S3 presigned upload URL: key={}", key);

        if (isMock) {
            String mockUrl = "https://dummy-s3-bucket.s3.amazonaws.com/" + key;
            return Map.of(
                    "uploadUrl", mockUrl,
                    "downloadUrl", mockUrl,
                    "fileId", key
            );
        }

        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(awsProperties.getS3().getBucketName())
                    .key(key)
                    .contentType(contentType)
                    .build();

            software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest presignRequest =
                    software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest.builder()
                            .signatureDuration(Duration.ofMinutes(15))
                            .putObjectRequest(putRequest)
                            .build();

            String uploadUrl = s3Presigner.presignPutObject(presignRequest).url().toString();
            String downloadUrl = generateUrl(key);

            return Map.of(
                    "uploadUrl", uploadUrl,
                    "downloadUrl", downloadUrl,
                    "fileId", key
            );
        } catch (Exception e) {
            log.error("Failed to generate presigned S3 upload URL for key {}: {}", key, e.getMessage(), e);
            throw new RuntimeException("Presigned S3 upload URL generation failed: " + e.getMessage(), e);
        }
    }
}
