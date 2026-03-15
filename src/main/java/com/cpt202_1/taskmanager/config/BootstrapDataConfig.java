package com.cpt202_1.taskmanager.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.UserRepository;

@Configuration
public class BootstrapDataConfig {
    @Bean
    CommandLineRunner seedDefaultAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            User admin = userRepository.findByUserName("admin").orElse(null);
            if (admin == null) {
                User created = new User();
                created.setUserName("admin");
                created.setPassword(passwordEncoder.encode("admin123"));
                created.setEmail("admin@taskmanager.local");
                created.setRole(UserRole.ADMIN_REVIEWER);
                created.setContributorApproved(true);
                userRepository.save(created);
                return;
            }

            String currentPassword = admin.getPassword();
            if (!isBcryptHash(currentPassword)) {
                admin.setPassword(passwordEncoder.encode(currentPassword));
                userRepository.save(admin);
            }
        };
    }

    private boolean isBcryptHash(String value) {
        return value != null
                && (value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$"));
    }
}
