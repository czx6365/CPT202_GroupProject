package com.cpt202_1.taskmanager.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.UserRepository;

@Configuration
public class BootstrapDataConfig {
    @Bean
    CommandLineRunner seedDefaultAdmin(UserRepository userRepository) {
        return args -> {
            if (!userRepository.existsByUserName("admin")) {
                User admin = new User();
                admin.setUserName("admin");
                admin.setPassword("admin123");
                admin.setEmail("admin@taskmanager.local");
                admin.setRole(UserRole.ADMIN_REVIEWER);
                admin.setContributorApproved(true);
                userRepository.save(admin);
            }
        };
    }
}
