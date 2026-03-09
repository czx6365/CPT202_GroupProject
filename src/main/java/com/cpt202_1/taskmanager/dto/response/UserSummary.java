package com.cpt202_1.taskmanager.dto.response;

import com.cpt202_1.taskmanager.pojo.enums.UserRole;

public record UserSummary(
        Long userId,
        String userName,
        String email,
        UserRole role,
        boolean contributorApproved) {
}
