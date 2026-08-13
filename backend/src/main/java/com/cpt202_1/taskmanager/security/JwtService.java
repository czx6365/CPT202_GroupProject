package com.cpt202_1.taskmanager.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.cpt202_1.taskmanager.config.JwtProperties;
import com.cpt202_1.taskmanager.dto.response.UserSummary;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {
    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(JwtProperties jwtProperties) {
        String jwtSecret = jwtProperties.secret();
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET is required. Configure app.jwt.secret through the runtime environment.");
        }

        byte[] secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET must be at least 32 bytes for HMAC-SHA signing.");
        }
        if (jwtProperties.expirationMs() <= 0) {
            throw new IllegalStateException("JWT_EXPIRATION_MS must be greater than zero.");
        }

        this.signingKey = Keys.hmacShaKeyFor(secretBytes);
        this.expirationMs = jwtProperties.expirationMs();
    }

    public String generateToken(UserSummary user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .subject(user.userName())
                .claim("uid", user.userId())
                .claim("role", user.role().name())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    public String extractUserName(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, String expectedUserName) {
        Claims claims = extractAllClaims(token);
        return expectedUserName.equals(claims.getSubject()) && claims.getExpiration().after(new Date());
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
