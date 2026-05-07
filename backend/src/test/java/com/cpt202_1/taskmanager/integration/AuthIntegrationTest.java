package com.cpt202_1.taskmanager.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.Announcement;
import com.cpt202_1.taskmanager.pojo.EmailVerificationCode;
import com.cpt202_1.taskmanager.pojo.enums.AnnouncementStatus;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.AnnouncementRepository;
import com.cpt202_1.taskmanager.repository.AuditLogRepository;
import com.cpt202_1.taskmanager.repository.EmailVerificationCodeRepository;
import com.cpt202_1.taskmanager.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private EmailVerificationCodeRepository verificationCodeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
        announcementRepository.deleteAll();
        verificationCodeRepository.deleteAll();
        userRepository.deleteAll();
        saveUser("admin", "admin123", "admin@taskmanager.local", UserRole.ADMIN_REVIEWER);
        saveUser("contributor", "contrib123", "contributor@test.com", UserRole.CONTRIBUTOR);
        saveUser("viewer1", "viewer123", "viewer1@test.com", UserRole.REGISTERED_VIEWER);
    }

    @Test
    void registerShouldSucceed() throws Exception {
        saveVerificationCode("newuser@test.com", "654321");
        RegisterPayload payload = new RegisterPayload("newuser", "123456", "newuser@test.com", "654321", null);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userName").value("newuser"))
                .andExpect(jsonPath("$.email").value("newuser@test.com"))
                .andExpect(jsonPath("$.role").value("REGISTERED_VIEWER"))
                .andExpect(jsonPath("$.contributorApproved").value(false));
    }

    @Test
    void loginShouldReturnToken() throws Exception {
        LoginPayload payload = new LoginPayload("viewer1", "viewer123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").isNumber())
                .andExpect(jsonPath("$.user.userName").value("viewer1"))
                .andExpect(jsonPath("$.user.role").value("REGISTERED_VIEWER"));
    }

    @Test
    void unauthenticatedRequestToProtectedEndpointShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void invalidResourceIdPathShouldReturn400() throws Exception {
        mockMvc.perform(get("/api/public/resources/svxnhds"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid value for resourceId"));
    }

    @Test
    void adminAnnouncementKeywordSearchShouldIncludeContentText() throws Exception {
        User admin = userRepository.findByUserName("admin").orElseThrow();
        Announcement announcement = new Announcement();
        announcement.setTitle("Platform update");
        announcement.setContent("Scheduled maintenance for search filters");
        announcement.setAudience("ALL_USERS");
        announcement.setStatus(AnnouncementStatus.PUBLISHED);
        announcement.setCreatedBy(admin);
        announcementRepository.save(announcement);

        String token = loginAndExtractToken("admin", "admin123");

        mockMvc.perform(get("/api/admin/announcements")
                        .queryParam("keyword", "maintenance")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Platform update"))
                .andExpect(jsonPath("$[0].content").value("Scheduled maintenance for search filters"));
    }

    @Test
    void contributorShouldSeePublishedAllUsersAndContributorAnnouncements() throws Exception {
        User admin = userRepository.findByUserName("admin").orElseThrow();
        saveAnnouncement(admin, "Public notice", "Visible to visitors", "PUBLIC", AnnouncementStatus.PUBLISHED);
        saveAnnouncement(admin, "All users notice", "Visible to every signed-in user", "ALL_USERS", AnnouncementStatus.PUBLISHED);
        saveAnnouncement(admin, "Contributor notice", "Visible to contributors", "CONTRIBUTORS", AnnouncementStatus.PUBLISHED);
        saveAnnouncement(admin, "Draft notice", "Drafts are not visible", "ALL_USERS", AnnouncementStatus.DRAFT);

        String token = loginAndExtractToken("contributor", "contrib123");

        mockMvc.perform(get("/api/announcements")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.title == 'Public notice')]").exists())
                .andExpect(jsonPath("$[?(@.title == 'All users notice')]").exists())
                .andExpect(jsonPath("$[?(@.title == 'Contributor notice')]").exists())
                .andExpect(jsonPath("$[?(@.title == 'Draft notice')]").doesNotExist());
    }

    @Test
    void publicVisitorShouldOnlySeePublishedPublicAnnouncements() throws Exception {
        User admin = userRepository.findByUserName("admin").orElseThrow();
        saveAnnouncement(admin, "Public notice", "Visible to visitors", "PUBLIC", AnnouncementStatus.PUBLISHED);
        saveAnnouncement(admin, "All users notice", "Requires login", "ALL_USERS", AnnouncementStatus.PUBLISHED);
        saveAnnouncement(admin, "Contributor notice", "Requires contributor", "CONTRIBUTORS", AnnouncementStatus.PUBLISHED);
        saveAnnouncement(admin, "Draft public notice", "Drafts are hidden", "PUBLIC", AnnouncementStatus.DRAFT);

        mockMvc.perform(get("/api/public/announcements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.title == 'Public notice')]").exists())
                .andExpect(jsonPath("$[?(@.title == 'All users notice')]").doesNotExist())
                .andExpect(jsonPath("$[?(@.title == 'Contributor notice')]").doesNotExist())
                .andExpect(jsonPath("$[?(@.title == 'Draft public notice')]").doesNotExist());
    }

    @Test
    void registeredViewerShouldSeePublishedPublicAndAllUsersAnnouncementsOnly() throws Exception {
        User admin = userRepository.findByUserName("admin").orElseThrow();
        saveAnnouncement(admin, "Public notice", "Visible to visitors", "PUBLIC", AnnouncementStatus.PUBLISHED);
        saveAnnouncement(admin, "All users notice", "Visible to signed-in users", "ALL_USERS", AnnouncementStatus.PUBLISHED);
        saveAnnouncement(admin, "Contributor notice", "Visible to contributors", "CONTRIBUTORS", AnnouncementStatus.PUBLISHED);

        String token = loginAndExtractToken("viewer1", "viewer123");

        mockMvc.perform(get("/api/announcements")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.title == 'Public notice')]").exists())
                .andExpect(jsonPath("$[?(@.title == 'All users notice')]").exists())
                .andExpect(jsonPath("$[?(@.title == 'Contributor notice')]").doesNotExist());
    }

    @Test
    void registeredViewerAccessingAdminEndpointShouldReturn403() throws Exception {
        String token = loginAndExtractToken("viewer1", "viewer123");

        mockMvc.perform(get("/api/admin/contributors/pending")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    private void saveUser(String userName, String rawPassword, String email, UserRole role) {
        User user = new User();
        user.setUserName(userName);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setEmail(email);
        user.setRole(role);
        user.setContributorApproved(role == UserRole.ADMIN_REVIEWER || role == UserRole.CONTRIBUTOR);
        user.setEnabled(true);
        userRepository.save(user);
    }

    private void saveVerificationCode(String email, String code) {
        EmailVerificationCode verificationCode = new EmailVerificationCode();
        verificationCode.setEmail(email);
        verificationCode.setCode(code);
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        verificationCodeRepository.save(verificationCode);
    }

    private void saveAnnouncement(User createdBy, String title, String content, String audience, AnnouncementStatus status) {
        Announcement announcement = new Announcement();
        announcement.setTitle(title);
        announcement.setContent(content);
        announcement.setAudience(audience);
        announcement.setStatus(status);
        announcement.setCreatedBy(createdBy);
        announcementRepository.save(announcement);
    }

    private String loginAndExtractToken(String userName, String password) throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginPayload(userName, password))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("token").asText();
    }

    private record RegisterPayload(String userName, String password, String email, String verificationCode, String role) {
    }

    private record LoginPayload(String userName, String password) {
    }
}
