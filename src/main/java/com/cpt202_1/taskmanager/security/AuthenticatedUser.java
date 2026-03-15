package com.cpt202_1.taskmanager.security;

import com.cpt202_1.taskmanager.pojo.enums.UserRole;

public class AuthenticatedUser {
    private final Long userId;
    private final String userName;
    private final UserRole role;

    public AuthenticatedUser(Long userId, String userName, UserRole role) {
        this.userId = userId;
        this.userName = userName;
        this.role = role;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public UserRole getRole() {
        return role;
    }
}
