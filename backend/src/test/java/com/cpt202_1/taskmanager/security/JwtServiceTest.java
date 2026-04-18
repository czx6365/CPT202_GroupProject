package com.cpt202_1.taskmanager.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.cpt202_1.taskmanager.config.JwtProperties;
import com.cpt202_1.taskmanager.dto.response.UserSummary;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;

class JwtServiceTest {

    private static final String SECRET = "12345678901234567890123456789012";

    @Test
    void generateTokenShouldExposeUserNameAndValidateMatchingUser() {
        JwtService jwtService = new JwtService(new JwtProperties(SECRET, 60_000));
        UserSummary user = new UserSummary(7L, "alice", "alice@example.com", UserRole.CONTRIBUTOR, true, null, null, null);

        String token = jwtService.generateToken(user);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUserName(token)).isEqualTo("alice");
        assertThat(jwtService.isTokenValid(token, "alice")).isTrue();
        assertThat(jwtService.isTokenValid(token, "bob")).isFalse();
    }

    @Test
    void getExpirationMsShouldReturnConfiguredValue() {
        JwtService jwtService = new JwtService(new JwtProperties(SECRET, 123_456));

        assertThat(jwtService.getExpirationMs()).isEqualTo(123_456);
    }
}
