package com.cpt202_1.taskmanager.dto.response;

import java.time.LocalDateTime;

import com.cpt202_1.taskmanager.pojo.enums.UserRole;

public record UserSummary(
        Long userId,
        String userName,
        String email,
        UserRole role,
        boolean contributorApproved,
        String contributorApplication,
        LocalDateTime contributorRequestedAt) {
}
