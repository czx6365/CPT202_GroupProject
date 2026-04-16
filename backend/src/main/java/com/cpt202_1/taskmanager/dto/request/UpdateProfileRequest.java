package com.cpt202_1.taskmanager.dto.request;

public record UpdateProfileRequest(
        String userName,
        String email,
        String currentPassword,
        String password) {
}
