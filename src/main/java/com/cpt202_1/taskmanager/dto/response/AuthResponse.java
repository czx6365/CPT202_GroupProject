package com.cpt202_1.taskmanager.dto.response;

public record AuthResponse(
        String token,
        String tokenType,
        long expiresIn,
        UserSummary user) {
}
