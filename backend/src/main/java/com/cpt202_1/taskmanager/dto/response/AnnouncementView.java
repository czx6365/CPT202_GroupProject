package com.cpt202_1.taskmanager.dto.response;

import java.time.LocalDateTime;

import com.cpt202_1.taskmanager.pojo.enums.AnnouncementStatus;

public record AnnouncementView(
        Long announcementId,
        String title,
        String content,
        String audience,
        AnnouncementStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Long createdBy,
        String createdByName) {
}
