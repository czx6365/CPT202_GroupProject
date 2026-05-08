package com.cpt202_1.taskmanager.controllers;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.security.AuthenticatedUser;
import com.cpt202_1.taskmanager.service.AccessControlService;

@RestController
@RequestMapping("/api/resources/uploads")
public class ResourceUploadController {
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "webp", "mp4", "mov", "webm", "pdf");

    private final AccessControlService accessControlService;
    private final Path uploadRoot;

    public ResourceUploadController(
            AccessControlService accessControlService,
            @Value("${app.upload-dir:uploads}") String uploadDir) {
        this.accessControlService = accessControlService;
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    @PostMapping
    public Map<String, String> uploadResourceFile(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam("file") MultipartFile file) {
        accessControlService.getUserOrThrow(currentUser.getUserId());

        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Upload file is required");
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename());
        String extension = getExtension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported file type");
        }

        try {
            Path resourceUploadDir = uploadRoot.resolve("resources").normalize();
            Files.createDirectories(resourceUploadDir);

            String storedName = UUID.randomUUID() + "." + extension;
            Path destination = resourceUploadDir.resolve(storedName).normalize();
            if (!destination.startsWith(resourceUploadDir)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid upload path");
            }

            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/resources/")
                    .path(storedName)
                    .toUriString();

            return Map.of(
                    "url", url,
                    "fileName", originalName);
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store uploaded file");
        }
    }

    private String getExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported file type");
        }
        return fileName.substring(dotIndex + 1).toLowerCase();
    }
}
