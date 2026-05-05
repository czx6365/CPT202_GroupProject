package com.cpt202_1.taskmanager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.cpt202_1.taskmanager.dto.request.LoginRequest;
import com.cpt202_1.taskmanager.dto.request.RegisterRequest;
import com.cpt202_1.taskmanager.dto.request.UpdateProfileRequest;
import com.cpt202_1.taskmanager.dto.response.UserSummary;
import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AccessControlService accessControlService;

    @Mock
    private PlatformViewMapper viewMapper;

    @Mock
    private EmailVerificationService emailVerificationService;

    @InjectMocks
    private AccountService accountService;

    @Captor
    private ArgumentCaptor<User> userCaptor;

    private UserSummary mappedSummary;

    @BeforeEach
    void setUp() {
        mappedSummary = new UserSummary(1L, "alice", "alice@example.com", UserRole.REGISTERED_VIEWER, false, null, null, null);
    }

    @Test
    void registerShouldTrimFieldsEncodePasswordAndSaveDefaultRole() {
        RegisterRequest request = new RegisterRequest(
                "  alice  ",
                "  secret123  ",
                "  ALICE@EXAMPLE.COM  ",
                "123456",
                UserRole.ADMIN_REVIEWER);

        when(userRepository.existsByUserName("alice")).thenReturn(false);
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encoded-secret");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(viewMapper.toUserSummary(any(User.class))).thenReturn(mappedSummary);

        UserSummary result = accountService.register(request);

        assertThat(result).isEqualTo(mappedSummary);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getUserName()).isEqualTo("alice");
        assertThat(savedUser.getEmail()).isEqualTo("alice@example.com");
        assertThat(savedUser.getPassword()).isEqualTo("encoded-secret");
        assertThat(savedUser.getRole()).isEqualTo(UserRole.REGISTERED_VIEWER);
        assertThat(savedUser.isContributorApproved()).isFalse();
        verify(emailVerificationService).verifyRegistrationCode("alice@example.com", "123456");
    }

    @Test
    void registerShouldRejectDuplicateEmail() {
        RegisterRequest request = new RegisterRequest("alice", "secret123", "alice@example.com", "123456", null);

        when(userRepository.existsByUserName("alice")).thenReturn(false);
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> accountService.register(request))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(apiException.getMessage()).isEqualTo("Email already exists");
                });

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void loginShouldUpgradeLegacyPlainTextPasswordAfterSuccessfulMatch() {
        User user = buildUser(1L, "alice", "plain-text", "alice@example.com");

        when(userRepository.findByUserName("alice")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("plain-text")).thenReturn("bcrypt-hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(viewMapper.toUserSummary(user)).thenReturn(mappedSummary);

        UserSummary result = accountService.login(new LoginRequest("alice", "plain-text"));

        assertThat(result).isEqualTo(mappedSummary);
        assertThat(user.getPassword()).isEqualTo("bcrypt-hash");
        verify(userRepository).save(user);
    }

    @Test
    void loginShouldRejectWrongPasswordForBcryptUser() {
        User user = buildUser(1L, "alice", "$2a$10$abcdefghijklmnopqrstuuVWxyz0123456789ABCDEabcde", "alice@example.com");

        when(userRepository.findByUserName("alice")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", user.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> accountService.login(new LoginRequest("alice", "wrong-password")))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(apiException.getMessage()).isEqualTo("Invalid userName or password");
                });

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateProfileShouldRequireCurrentPasswordBeforeChangingPassword() {
        User user = buildUser(1L, "alice", "$2a$10$abcdefghijklmnopqrstuuVWxyz0123456789ABCDEabcde", "alice@example.com");
        when(accessControlService.getUserOrThrow(1L)).thenReturn(user);

        UpdateProfileRequest request = new UpdateProfileRequest(null, null, "   ", "new-secret");

        assertThatThrownBy(() -> accountService.updateProfile(1L, request))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiException.getMessage()).isEqualTo("Current password is required");
                });

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateProfileShouldNormalizeEmailAndEncodeNewPassword() {
        User user = buildUser(1L, "alice", "$2a$10$abcdefghijklmnopqrstuuVWxyz0123456789ABCDEabcde", "alice@old.com");
        UserSummary updatedSummary = new UserSummary(1L, "alice", "new@example.com", UserRole.REGISTERED_VIEWER, false, null, null, null);

        when(accessControlService.getUserOrThrow(1L)).thenReturn(user);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.matches("old-secret", user.getPassword())).thenReturn(true);
        when(passwordEncoder.encode("new-secret")).thenReturn("new-bcrypt-hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(viewMapper.toUserSummary(any(User.class))).thenReturn(updatedSummary);

        UserSummary result = accountService.updateProfile(
                1L,
                new UpdateProfileRequest(null, "  NEW@EXAMPLE.COM ", " old-secret ", " new-secret "));

        assertThat(result).isEqualTo(updatedSummary);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo("new@example.com");
        assertThat(savedUser.getPassword()).isEqualTo("new-bcrypt-hash");
    }

    private User buildUser(Long id, String userName, String password, String email) {
        User user = new User();
        user.setUserId(id);
        user.setUserName(userName);
        user.setPassword(password);
        user.setEmail(email);
        user.setRole(UserRole.REGISTERED_VIEWER);
        user.setEnabled(true);
        return user;
    }
}
