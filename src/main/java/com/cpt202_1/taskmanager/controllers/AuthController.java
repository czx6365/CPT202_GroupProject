package com.cpt202_1.taskmanager.controllers;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cpt202_1.taskmanager.dto.request.LoginRequest;
import com.cpt202_1.taskmanager.dto.request.RegisterRequest;
import com.cpt202_1.taskmanager.dto.response.UserSummary;
import com.cpt202_1.taskmanager.service.PlatformService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final PlatformService platformService;

    public AuthController(PlatformService platformService) {
        this.platformService = platformService;
    }

    @PostMapping("/register")
    public UserSummary register(@RequestBody RegisterRequest request) {
        return platformService.register(request);
    }

    @PostMapping("/login")
    public UserSummary login(@RequestBody LoginRequest request) {
        return platformService.login(request);
    }

    @PostMapping("/logout")
    public Map<String, String> logout() {
        return Map.of("message", "Logout success (stateless initial version)");
    }
}
