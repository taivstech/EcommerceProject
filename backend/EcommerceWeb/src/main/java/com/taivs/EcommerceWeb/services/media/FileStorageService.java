package com.taivs.EcommerceWeb.services.media;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface FileStorageService {

    Map<String, String> upload(MultipartFile file, String folder);

    default String uploadAndGetUrl(MultipartFile file, String folder) {
        return upload(file, folder).get("url");
    }

    default List<String> uploadMultiple(MultipartFile[] files, String folder) {
        List<String> urls = new java.util.ArrayList<>();
        if (files != null) {
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;
                urls.add(uploadAndGetUrl(file, folder));
            }
        }
        return urls;
    }

    void delete(String fileId);

    default Map<String, String> generatePresignedUploadUrl(String folder, String filename, String contentType) {
        return Map.of();
    }
}
