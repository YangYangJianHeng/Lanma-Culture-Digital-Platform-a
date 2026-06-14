package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/upload")
public class UploadController {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private static final java.util.Set<String> ALLOWED_EXTENSIONS = java.util.Set.of(
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg",
        ".mp4", ".webm", ".mov", ".avi",
        ".glb", ".gltf"
    );

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("请选择要上传的文件"));
        }

        try {
            String originalName = file.getOriginalFilename();
            String ext = "";
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
            }
            if (!ALLOWED_EXTENSIONS.contains(ext)) {
                return ResponseEntity.badRequest().body(ApiResponse.badRequest("不支持的文件类型: " + ext));
            }
            String fileName = UUID.randomUUID().toString() + ext;

            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            String fileUrl = "/uploads/" + fileName;
            return ResponseEntity.ok(ApiResponse.success("上传成功", Map.of("url", fileUrl)));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(ApiResponse.error(500, "文件上传失败"));
        }
    }
}
