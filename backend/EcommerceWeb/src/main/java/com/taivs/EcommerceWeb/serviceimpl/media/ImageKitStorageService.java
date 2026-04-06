package com.taivs.EcommerceWeb.serviceimpl.media;

import com.taivs.EcommerceWeb.config.integration.ImageKitProperties;
import com.taivs.EcommerceWeb.services.media.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageKitStorageService implements FileStorageService {

    private static final String IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
    private static final String IMAGEKIT_DELETE_URL = "https://api.imagekit.io/v1/files/";

    private final ImageKitProperties imageKitProperties;

    @Override
    public Map<String, String> upload(MultipartFile file, String folder) {
        try {
            RestTemplate rest = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBasicAuth(imageKitProperties.getPrivateKey(), "");

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", file.getResource());
            body.add("fileName", file.getOriginalFilename());
            body.add("folder", folder);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = rest.postForObject(IMAGEKIT_UPLOAD_URL, request, Map.class);

            if (response == null) {
                throw new RuntimeException("Empty response from ImageKit");
            }

            return Map.of(
                    "url", String.valueOf(response.get("url")),
                    "fileId", String.valueOf(response.get("fileId")),
                    "thumbnailUrl", String.valueOf(response.getOrDefault("thumbnailUrl", ""))
            );
        } catch (Exception e) {
            log.error("ImageKit upload failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload image: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String fileId) {
        try {
            RestTemplate rest = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(imageKitProperties.getPrivateKey(), "");

            HttpEntity<Void> request = new HttpEntity<>(headers);
            rest.exchange(IMAGEKIT_DELETE_URL + fileId, HttpMethod.DELETE, request, Void.class);
        } catch (Exception e) {
            log.error("ImageKit delete failed for fileId {}: {}", fileId, e.getMessage(), e);
            throw new RuntimeException("Failed to delete image: " + e.getMessage(), e);
        }
    }
}
