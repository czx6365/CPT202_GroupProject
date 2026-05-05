package com.cpt202_1.taskmanager.dto.request;

import com.cpt202_1.taskmanager.pojo.enums.UserRole;

public record RegisterRequest(
        String userName,
        String password,
        String email,
        String verificationCode,
        UserRole role) {
}
