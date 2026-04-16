package com.cpt202_1.taskmanager.service;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.cpt202_1.taskmanager.dto.request.LoginRequest;
import com.cpt202_1.taskmanager.dto.request.RegisterRequest;
import com.cpt202_1.taskmanager.dto.request.UpdateProfileRequest;
import com.cpt202_1.taskmanager.dto.response.UserSummary;
import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.UserRepository;

@Service
@Transactional
public class AccountService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccessControlService accessControlService;
    private final PlatformViewMapper viewMapper;

    public AccountService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AccessControlService accessControlService,
            PlatformViewMapper viewMapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.accessControlService = accessControlService;
        this.viewMapper = viewMapper;
    }

    public UserSummary register(RegisterRequest request) {
        if (request == null || !StringUtils.hasText(request.userName()) || !StringUtils.hasText(request.password())
                || !StringUtils.hasText(request.email())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "userName, password, email are required");
        }

        String userName = request.userName().trim();
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByUserName(userName)) {
            throw new ApiException(HttpStatus.CONFLICT, "User name already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }

        User user = new User();
        user.setUserName(userName);
        user.setPassword(passwordEncoder.encode(request.password().trim()));
        user.setEmail(email);
        user.setRole(UserRole.REGISTERED_VIEWER);
        user.setContributorApproved(false);
        user.setContributorRejectionReason(null);
        userRepository.save(user);

        return viewMapper.toUserSummary(user);
    }

    public UserSummary login(LoginRequest request) {
        if (request == null || !StringUtils.hasText(request.userName()) || !StringUtils.hasText(request.password())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "userName and password are required");
        }

        User user = userRepository.findByUserName(request.userName().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid userName or password"));
        if (!user.isEnabled()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "User is disabled");
        }
        if (!passwordMatchesAndUpgradeIfNeeded(user, request.password())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid userName or password");
        }

        return viewMapper.toUserSummary(user);
    }

    @Transactional(readOnly = true)
    public UserSummary getProfile(Long userId) {
        return viewMapper.toUserSummary(accessControlService.getUserOrThrow(userId));
    }

    public UserSummary updateProfile(Long userId, UpdateProfileRequest request) {
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        User user = accessControlService.getUserOrThrow(userId);

        if (StringUtils.hasText(request.userName())) {
            String newUserName = request.userName().trim();
            if (!newUserName.equals(user.getUserName()) && userRepository.existsByUserName(newUserName)) {
                throw new ApiException(HttpStatus.CONFLICT, "User name already exists");
            }
            user.setUserName(newUserName);
        }

        if (StringUtils.hasText(request.email())) {
            String newEmail = request.email().trim().toLowerCase();
            if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
            }
            user.setEmail(newEmail);
        }

        if (StringUtils.hasText(request.password())) {
            if (!StringUtils.hasText(request.currentPassword())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is required");
            }

            String currentPassword = request.currentPassword().trim();
            if (!passwordMatchesAndUpgradeIfNeeded(user, currentPassword)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
            }

            String newPassword = request.password().trim();
            if (newPassword.length() < 6) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "New password must contain at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        return viewMapper.toUserSummary(userRepository.save(user));
    }

    public UserSummary applyContributor(Long userId, String applicationText) {
        if (!StringUtils.hasText(applicationText)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Application content is required");
        }

        User user = accessControlService.getUserOrThrow(userId);
        if (!user.isEnabled()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "User is disabled");
        }
        if (user.getRole() == UserRole.ADMIN_REVIEWER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Admin account cannot apply as contributor");
        }
        if (user.getRole() == UserRole.CONTRIBUTOR && user.isContributorApproved()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You are already an approved contributor");
        }

        user.setRole(UserRole.REGISTERED_VIEWER);
        user.setContributorApproved(false);
        user.setContributorApplication(applicationText.trim());
        user.setContributorRequestedAt(LocalDateTime.now());
        user.setContributorRejectionReason(null);
        return viewMapper.toUserSummary(userRepository.save(user));
    }

    private boolean passwordMatchesAndUpgradeIfNeeded(User user, String rawPassword) {
        String encodedOrRaw = user.getPassword();

        if (isBcryptHash(encodedOrRaw)) {
            return passwordEncoder.matches(rawPassword, encodedOrRaw);
        }

        boolean matched = encodedOrRaw.equals(rawPassword);
        if (matched) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
        }
        return matched;
    }

    private boolean isBcryptHash(String value) {
        return StringUtils.hasText(value)
                && (value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$"));
    }
}
