package com.cpt202_1.taskmanager.controllers;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cpt202_1.taskmanager.dto.request.LoginRequest;
import com.cpt202_1.taskmanager.dto.request.RegisterRequest;
import com.cpt202_1.taskmanager.dto.response.AuthResponse;
import com.cpt202_1.taskmanager.dto.response.UserSummary;
import com.cpt202_1.taskmanager.security.JwtService;
import com.cpt202_1.taskmanager.service.PlatformService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final PlatformService platformService;
    private final JwtService jwtService;

    public AuthController(PlatformService platformService, JwtService jwtService) {
        this.platformService = platformService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public UserSummary register(@RequestBody RegisterRequest request) {
        return platformService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        UserSummary user = platformService.login(request);
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, "Bearer", jwtService.getExpirationMs() / 1000, user);
    }

    @PostMapping("/logout")
    public Map<String, String> logout() {
        return Map.of("message", "Logout success (stateless initial version)");
    }
}
