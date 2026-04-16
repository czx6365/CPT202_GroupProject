package com.cpt202_1.taskmanager.pojo;

import java.time.LocalDateTime;

import com.cpt202_1.taskmanager.pojo.enums.UserRole;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Table(name = "tb_user")
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_name", nullable = false, unique = true)
    private String userName;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_type", nullable = false)
    private UserRole role = UserRole.REGISTERED_VIEWER;

    @Column(name = "contributor_approved", nullable = false)
    private boolean contributorApproved = false;

    @Column(name = "contributor_application", length = 2000)
    private String contributorApplication;

    @Column(name = "contributor_requested_at")
    private LocalDateTime contributorRequestedAt;

    @Column(name = "contributor_rejection_reason", length = 2000)
    private String contributorRejectionReason;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public User() {
    }

    public User(Long userId, String userName, String password, String email, UserRole role) {
        this.userId = userId;
        this.userName = userName;
        this.password = password;
        this.email = email;
        this.role = role;
        this.contributorApproved = false;
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public boolean isContributorApproved() {
        return contributorApproved;
    }

    public void setContributorApproved(boolean contributorApproved) {
        this.contributorApproved = contributorApproved;
    }

    public String getContributorApplication() {
        return contributorApplication;
    }

    public void setContributorApplication(String contributorApplication) {
        this.contributorApplication = contributorApplication;
    }

    public LocalDateTime getContributorRequestedAt() {
        return contributorRequestedAt;
    }

    public void setContributorRequestedAt(LocalDateTime contributorRequestedAt) {
        this.contributorRequestedAt = contributorRequestedAt;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getContributorRejectionReason() {
        return contributorRejectionReason;
    }

    public void setContributorRejectionReason(String contributorRejectionReason) {
        this.contributorRejectionReason = contributorRejectionReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public String toString() {
        return "User{" +
                "userId=" + userId +
                ", userName='" + userName + '\'' +
                ", role=" + role +
                ", contributorApproved=" + contributorApproved +
                '}';
    }
}
