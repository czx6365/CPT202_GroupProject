package com.cpt202_1.taskmanager.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.EmailVerificationCode;
import com.cpt202_1.taskmanager.repository.EmailVerificationCodeRepository;
import com.cpt202_1.taskmanager.repository.UserRepository;

@Service
@Transactional
public class EmailVerificationService {
    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Duration RESEND_INTERVAL = Duration.ofMinutes(1);
    private static final Duration CODE_TTL = Duration.ofMinutes(5);

    private final EmailVerificationCodeRepository verificationCodeRepository;
    private final UserRepository userRepository;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final SecureRandom secureRandom = new SecureRandom();
    private final String fromAddress;

    public EmailVerificationService(
            EmailVerificationCodeRepository verificationCodeRepository,
            UserRepository userRepository,
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${spring.mail.username:}") String fromAddress) {
        this.verificationCodeRepository = verificationCodeRepository;
        this.userRepository = userRepository;
        this.mailSenderProvider = mailSenderProvider;
        this.fromAddress = fromAddress;
    }

    public void sendRegistrationCode(String rawEmail) {
        String email = normalizeAndValidateEmail(rawEmail);
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }

        LocalDateTime now = LocalDateTime.now();
        verificationCodeRepository.findTopByEmailOrderByCreatedAtDesc(email).ifPresent(latest -> {
            long elapsedSeconds = Duration.between(latest.getCreatedAt(), now).getSeconds();
            if (elapsedSeconds < RESEND_INTERVAL.toSeconds()) {
                long waitSeconds = RESEND_INTERVAL.toSeconds() - elapsedSeconds;
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                        "Please wait " + waitSeconds + " seconds before requesting a new code");
            }
        });

        verificationCodeRepository.findByEmailAndUsedFalse(email).forEach(code -> code.setUsed(true));

        String code = "%06d".formatted(secureRandom.nextInt(1_000_000));
        EmailVerificationCode verificationCode = new EmailVerificationCode();
        verificationCode.setEmail(email);
        verificationCode.setCode(code);
        verificationCode.setExpiresAt(now.plus(CODE_TTL));
        verificationCodeRepository.save(verificationCode);

        try {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Mail server is not configured. Please set spring.mail.host and account settings.");
            }
            mailSender.send(buildMessage(email, code));
            log.info("Sent registration verification code to {}", email);
        } catch (ApiException ex) {
            verificationCodeRepository.delete(verificationCode);
            throw ex;
        } catch (MailException ex) {
            verificationCodeRepository.delete(verificationCode);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to send verification email. Please check mail server settings.");
        }
    }

    public void verifyRegistrationCode(String rawEmail, String rawCode) {
        String email = normalizeAndValidateEmail(rawEmail);
        if (!StringUtils.hasText(rawCode)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification code is required");
        }

        String code = rawCode.trim();
        EmailVerificationCode verificationCode = verificationCodeRepository
                .findTopByEmailAndUsedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Please request a verification code first"));

        if (verificationCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            verificationCode.setUsed(true);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification code has expired");
        }

        if (!verificationCode.getCode().equals(code)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification code is incorrect");
        }

        verificationCode.setUsed(true);
    }

    private SimpleMailMessage buildMessage(String email, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        if (StringUtils.hasText(fromAddress)) {
            message.setFrom(fromAddress);
        }
        message.setTo(email);
        message.setSubject("HeritageHub registration verification code");
        message.setText("""
                Your HeritageHub registration verification code is:

                %s

                This code will expire in 5 minutes. If you did not request this code, please ignore this email.
                """.formatted(code));
        return message;
    }

    private String normalizeAndValidateEmail(String rawEmail) {
        if (!StringUtils.hasText(rawEmail)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        String email = rawEmail.trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please enter a valid email address");
        }
        return email;
    }
}
