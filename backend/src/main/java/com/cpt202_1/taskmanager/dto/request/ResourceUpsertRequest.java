package com.cpt202_1.taskmanager.dto.request;

import java.util.Set;

public record ResourceUpsertRequest(
        String title,
        String topic,
        String placeName,
        String description,
        Long categoryId,
        Set<String> tags,
        String fileUrl,
        String fileLinkUrl,
        String externalLink,
        String copyrightDeclaration) {
}
