package com.cpt202_1.taskmanager.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.UserRepository;

@Configuration
public class BootstrapDataConfig {

    @Value("${app.bootstrap.admin.enabled:false}")
    private boolean adminBootstrapEnabled;

    @Value("${app.bootstrap.admin.username:}")
    private String adminUsername;

    @Value("${app.bootstrap.admin.password:}")
    private String adminPassword;

    @Value("${app.bootstrap.admin.email:}")
    private String adminEmail;

    @Bean
    CommandLineRunner seedConfiguredAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // 默认关闭管理员自动创建，避免公开仓库部署后产生可预测账号。
            if (!adminBootstrapEnabled) {
                return;
            }

            validateBootstrapCredentials();

            if (userRepository.findByUserName(adminUsername).isPresent()) {
                return;
            }

            User created = new User();
            created.setUserName(adminUsername);
            created.setPassword(passwordEncoder.encode(adminPassword));
            created.setEmail(adminEmail);
            created.setRole(UserRole.ADMIN_REVIEWER);
            created.setContributorApproved(true);
            userRepository.save(created);
        };
    }

    private void validateBootstrapCredentials() {
        if (adminUsername == null || adminUsername.isBlank()) {
            throw new IllegalStateException(
                    "BOOTSTRAP_ADMIN_USERNAME is required when administrator bootstrap is enabled.");
        }
        if (adminEmail == null || adminEmail.isBlank()) {
            throw new IllegalStateException(
                    "BOOTSTRAP_ADMIN_EMAIL is required when administrator bootstrap is enabled.");
        }
        if (adminPassword == null || adminPassword.length() < 12) {
            throw new IllegalStateException(
                    "BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters when administrator bootstrap is enabled.");
        }
    }
}
