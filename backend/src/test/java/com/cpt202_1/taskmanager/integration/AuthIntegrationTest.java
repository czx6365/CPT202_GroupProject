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
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

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
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        saveUser("admin", "admin123", "admin@taskmanager.local", UserRole.ADMIN_REVIEWER);
        saveUser("viewer1", "viewer123", "viewer1@test.com", UserRole.REGISTERED_VIEWER);
    }

    @Test
    void registerShouldSucceed() throws Exception {
        RegisterPayload payload = new RegisterPayload("newuser", "123456", "newuser@test.com", null);

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

    private record RegisterPayload(String userName, String password, String email, String role) {
    }

    private record LoginPayload(String userName, String password) {
    }
}
