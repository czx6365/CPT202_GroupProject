package com.cpt202_1.taskmanager.controllers;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.ResourceFile;
import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.repository.ResourceFileRepository;
import com.cpt202_1.taskmanager.security.AuthenticatedUser;
import com.cpt202_1.taskmanager.service.AccessControlService;

@RestController
public class ResourceUploadController {
    private static final long MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "webp", "mp4", "mov", "webm", "pdf");

    private final AccessControlService accessControlService;
    private final ResourceFileRepository resourceFileRepository;

    public ResourceUploadController(
            AccessControlService accessControlService,
            ResourceFileRepository resourceFileRepository) {
        this.accessControlService = accessControlService;
        this.resourceFileRepository = resourceFileRepository;
    }

    @PostMapping("/api/resources/uploads")
    public Map<String, String> uploadResourceFile(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam("file") MultipartFile file) {
        User uploader = accessControlService.getUserOrThrow(currentUser.getUserId());

        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Upload file is required");
        }
        if (file.getSize() > MAX_UPLOAD_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Upload file must be 10 MB or smaller");
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename());
        String extension = getExtension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported file type");
        }

        try {
            ResourceFile resourceFile = new ResourceFile();
            resourceFile.setFileId(UUID.randomUUID().toString());
            resourceFile.setFileName(originalName);
            resourceFile.setContentType(resolveContentType(file.getContentType(), extension));
            resourceFile.setData(file.getBytes());
            resourceFile.setUploadedBy(uploader);

            ResourceFile savedFile = resourceFileRepository.save(resourceFile);
            String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/public/resource-files/")
                    .path(savedFile.getFileId())
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

    private String resolveContentType(String declaredContentType, String extension) {
        if (StringUtils.hasText(declaredContentType)) {
            return declaredContentType;
        }
        return switch (extension) {
            case "jpg", "jpeg" -> MediaType.IMAGE_JPEG_VALUE;
            case "png" -> MediaType.IMAGE_PNG_VALUE;
            case "gif" -> MediaType.IMAGE_GIF_VALUE;
            case "webp" -> "image/webp";
            case "mp4" -> "video/mp4";
            case "mov" -> "video/quicktime";
            case "webm" -> "video/webm";
            case "pdf" -> MediaType.APPLICATION_PDF_VALUE;
            default -> MediaType.APPLICATION_OCTET_STREAM_VALUE;
        };
    }

    @GetMapping("/api/public/resource-files/{fileId}")
    public ResponseEntity<byte[]> downloadResourceFile(@PathVariable String fileId) {
        ResourceFile file = resourceFileRepository.findById(fileId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Resource file not found"));

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .body(file.getData());
    }
}
