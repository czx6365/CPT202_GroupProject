package com.cpt202_1.taskmanager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.EmailVerificationCode;
import com.cpt202_1.taskmanager.repository.EmailVerificationCodeRepository;
import com.cpt202_1.taskmanager.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock
    private EmailVerificationCodeRepository verificationCodeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ObjectProvider<JavaMailSender> mailSenderProvider;

    @Mock
    private JavaMailSender mailSender;

    @Captor
    private ArgumentCaptor<EmailVerificationCode> codeCaptor;

    @Captor
    private ArgumentCaptor<SimpleMailMessage> messageCaptor;

    private EmailVerificationService emailVerificationService;

    @BeforeEach
    void setUp() {
        emailVerificationService = new EmailVerificationService(
                verificationCodeRepository,
                userRepository,
                mailSenderProvider,
                "heritagehub@163.com");
    }

    @Test
    void sendRegistrationCodeShouldSaveCodeAndSendEmail() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(verificationCodeRepository.findTopByEmailOrderByCreatedAtDesc("alice@example.com"))
                .thenReturn(Optional.empty());
        when(verificationCodeRepository.findByEmailAndUsedFalse("alice@example.com")).thenReturn(List.of());
        when(verificationCodeRepository.save(any(EmailVerificationCode.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(mailSenderProvider.getIfAvailable()).thenReturn(mailSender);

        emailVerificationService.sendRegistrationCode("  ALICE@EXAMPLE.COM  ");

        verify(verificationCodeRepository).save(codeCaptor.capture());
        EmailVerificationCode savedCode = codeCaptor.getValue();
        assertThat(savedCode.getEmail()).isEqualTo("alice@example.com");
        assertThat(savedCode.getCode()).matches("\\d{6}");
        assertThat(savedCode.getExpiresAt()).isAfter(LocalDateTime.now().plusMinutes(4));
        assertThat(savedCode.isUsed()).isFalse();

        verify(mailSender).send(messageCaptor.capture());
        SimpleMailMessage message = messageCaptor.getValue();
        assertThat(message.getTo()).containsExactly("alice@example.com");
        assertThat(message.getFrom()).isEqualTo("heritagehub@163.com");
        assertThat(message.getText()).contains(savedCode.getCode());
    }

    @Test
    void sendRegistrationCodeShouldRejectResendWithinOneMinute() {
        EmailVerificationCode latestCode = buildCode("alice@example.com", "123456", LocalDateTime.now().plusMinutes(5));

        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(verificationCodeRepository.findTopByEmailOrderByCreatedAtDesc("alice@example.com"))
                .thenReturn(Optional.of(latestCode));

        assertThatThrownBy(() -> emailVerificationService.sendRegistrationCode("alice@example.com"))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                    assertThat(apiException.getMessage()).contains("Please wait");
                });

        verify(verificationCodeRepository, never()).save(any(EmailVerificationCode.class));
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void verifyRegistrationCodeShouldMarkMatchingCodeAsUsed() {
        EmailVerificationCode verificationCode = buildCode(
                "alice@example.com",
                "123456",
                LocalDateTime.now().plusMinutes(5));

        when(verificationCodeRepository.findTopByEmailAndUsedFalseOrderByCreatedAtDesc("alice@example.com"))
                .thenReturn(Optional.of(verificationCode));

        emailVerificationService.verifyRegistrationCode("ALICE@EXAMPLE.COM", " 123456 ");

        assertThat(verificationCode.isUsed()).isTrue();
    }

    @Test
    void verifyRegistrationCodeShouldRejectWrongCode() {
        EmailVerificationCode verificationCode = buildCode(
                "alice@example.com",
                "123456",
                LocalDateTime.now().plusMinutes(5));

        when(verificationCodeRepository.findTopByEmailAndUsedFalseOrderByCreatedAtDesc("alice@example.com"))
                .thenReturn(Optional.of(verificationCode));

        assertThatThrownBy(() -> emailVerificationService.verifyRegistrationCode("alice@example.com", "000000"))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiException.getMessage()).isEqualTo("Verification code is incorrect");
                });

        assertThat(verificationCode.isUsed()).isFalse();
    }

    @Test
    void verifyRegistrationCodeShouldRejectExpiredCodeAndMarkItUsed() {
        EmailVerificationCode verificationCode = buildCode(
                "alice@example.com",
                "123456",
                LocalDateTime.now().minusSeconds(1));

        when(verificationCodeRepository.findTopByEmailAndUsedFalseOrderByCreatedAtDesc("alice@example.com"))
                .thenReturn(Optional.of(verificationCode));

        assertThatThrownBy(() -> emailVerificationService.verifyRegistrationCode("alice@example.com", "123456"))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiException.getMessage()).isEqualTo("Verification code has expired");
                });

        assertThat(verificationCode.isUsed()).isTrue();
    }

    private EmailVerificationCode buildCode(String email, String code, LocalDateTime expiresAt) {
        EmailVerificationCode verificationCode = new EmailVerificationCode();
        verificationCode.setEmail(email);
        verificationCode.setCode(code);
        verificationCode.setExpiresAt(expiresAt);
        ReflectionTestUtils.setField(verificationCode, "createdAt", LocalDateTime.now());
        return verificationCode;
    }
}
