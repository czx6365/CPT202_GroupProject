package com.cpt202_1.taskmanager.dto.response;

import java.time.LocalDateTime;
import java.util.Set;

import com.cpt202_1.taskmanager.pojo.enums.ResourceStatus;

public record ResourceSummary(
        Long resourceId,
        String title,
        String topic,
        String placeName,
        ResourceStatus status,
        Long contributorId,
        String contributorName,
        Long categoryId,
        String categoryName,
        Set<String> tags,
        LocalDateTime updatedAt) {
}
