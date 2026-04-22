package com.cpt202_1.taskmanager.dto.request;

public record AnnouncementUpsertRequest(
        String title,
        String content,
        String audience) {
}
