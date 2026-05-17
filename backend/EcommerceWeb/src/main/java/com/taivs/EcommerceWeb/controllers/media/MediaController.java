package com.taivs.EcommerceWeb.controllers.media;

import com.taivs.EcommerceWeb.services.media.FileStorageService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class MediaController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ApiResponse<Map<String, String>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "/ecommerce") String folder) {
        Map<String, String> result = fileStorageService.upload(file, folder);
        return ApiResponse.<Map<String, String>>builder().result(result).build();
    }

    @PostMapping("/upload-multiple")
    public ApiResponse<List<Map<String, String>>> uploadMultiple(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "folder", defaultValue = "/ecommerce") String folder) {
        List<Map<String, String>> results = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty())
                continue;
            results.add(fileStorageService.upload(file, folder));
        }
        return ApiResponse.<List<Map<String, String>>>builder().result(results).build();
    }

    @DeleteMapping("/{fileId}")
    public ApiResponse<Void> delete(@PathVariable String fileId) {
        fileStorageService.delete(fileId);
        return ApiResponse.<Void>builder().build();
    }
}
