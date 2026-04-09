package com.cpt202_1.taskmanager.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cpt202_1.taskmanager.dto.request.ContributorApplicationRequest;
import com.cpt202_1.taskmanager.dto.request.UpdateProfileRequest;
import com.cpt202_1.taskmanager.dto.response.UserSummary;
import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.security.AuthenticatedUser;
import com.cpt202_1.taskmanager.service.AccountService;

@RestController
@RequestMapping("/api/users")
public class ProfileController {
    private final AccountService accountService;

    public ProfileController(AccountService accountService) {
        this.accountService = accountService;
    }

    // 1. get user profile
    // 2. update user profile
    @GetMapping("/{userId}")
    public UserSummary getProfile(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long userId) {
        requireSelfOrAdmin(currentUser, userId);
        return accountService.getProfile(userId);
    }

    @PutMapping("/{userId}")
    public UserSummary updateProfile(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long userId,
            @RequestBody UpdateProfileRequest request) {
        requireSelfOrAdmin(currentUser, userId);
        return accountService.updateProfile(userId, request);
    }

    @PostMapping("/{userId}/contributor-application")
    public UserSummary applyContributor(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long userId,
            @RequestBody ContributorApplicationRequest request) {
        requireSelfOrAdmin(currentUser, userId);
        return accountService.applyContributor(userId, request == null ? null : request.application());
    }

    private void requireSelfOrAdmin(AuthenticatedUser currentUser, Long targetUserId) {
        boolean isSelf = currentUser.getUserId().equals(targetUserId);
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN_REVIEWER;
        if (!isSelf && !isAdmin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only access your own profile");
        }
    }
}
