package com.cpt202_1.taskmanager.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cpt202_1.taskmanager.dto.request.UpdateProfileRequest;
import com.cpt202_1.taskmanager.dto.response.UserSummary;
import com.cpt202_1.taskmanager.service.PlatformService;

@RestController
@RequestMapping("/api/users")
public class ProfileController {
    private final PlatformService platformService;

    public ProfileController(PlatformService platformService) {
        this.platformService = platformService;
    }

    @GetMapping("/{userId}")
    public UserSummary getProfile(@PathVariable Long userId) {
        return platformService.getProfile(userId);
    }

    @PutMapping("/{userId}")
    public UserSummary updateProfile(@PathVariable Long userId, @RequestBody UpdateProfileRequest request) {
        return platformService.updateProfile(userId, request);
    }
}
