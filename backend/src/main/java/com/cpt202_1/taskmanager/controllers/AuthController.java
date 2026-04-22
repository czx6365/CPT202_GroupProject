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
import com.cpt202_1.taskmanager.service.AccountService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AccountService accountService;
    private final JwtService jwtService;

    public AuthController(AccountService accountService, JwtService jwtService) {
        this.accountService = accountService;
        this.jwtService = jwtService;
    }

    // 1. register user
    // 2. login user
    // 3. logout user
    @PostMapping("/register")
    public UserSummary register(@RequestBody RegisterRequest request) {
        return accountService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        UserSummary user = accountService.login(request);
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, "Bearer", jwtService.getExpirationMs() / 1000, user);
    }

    @PostMapping("/logout")
    public Map<String, String> logout() {
        return Map.of("message", "Logout success (stateless initial version)");
    }
}
