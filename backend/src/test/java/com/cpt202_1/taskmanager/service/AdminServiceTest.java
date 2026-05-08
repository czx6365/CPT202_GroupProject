package com.cpt202_1.taskmanager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.cpt202_1.taskmanager.dto.request.ContributorDecisionRequest;
import com.cpt202_1.taskmanager.dto.request.CreateCategoryRequest;
import com.cpt202_1.taskmanager.dto.response.ResourceDetail;
import com.cpt202_1.taskmanager.dto.response.UserSummary;
import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.Category;
import com.cpt202_1.taskmanager.pojo.ResourceEntry;
import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.ResourceStatus;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.CategoryRepository;
import com.cpt202_1.taskmanager.repository.ResourceEntryRepository;
import com.cpt202_1.taskmanager.repository.TagRepository;
import com.cpt202_1.taskmanager.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private AccessControlService accessControlService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private ResourceEntryRepository resourceEntryRepository;

    @Mock
    private PlatformViewMapper viewMapper;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AdminService adminService;

    @Captor
    private ArgumentCaptor<User> userCaptor;

    @Captor
    private ArgumentCaptor<ResourceEntry> resourceCaptor;

    private User admin;

    @BeforeEach
    void setUp() {
        admin = buildUser(100L, "admin", UserRole.ADMIN_REVIEWER);
        admin.setEnabled(true);
    }

    @Test
    void approveContributorShouldPromotePendingApplicantToContributor() {
        User contributor = buildUser(1L, "alice", UserRole.REGISTERED_VIEWER);
        contributor.setContributorApplication("I want to contribute");
        contributor.setContributorRequestedAt(LocalDateTime.now().minusDays(1));

        UserSummary mappedSummary = new UserSummary(
                1L,
                "alice",
                "alice@example.com",
                UserRole.CONTRIBUTOR,
                true,
                "I want to contribute",
                contributor.getContributorRequestedAt(),
                null);

        when(accessControlService.getUserOrThrow(100L)).thenReturn(admin);
        when(accessControlService.getUserOrThrow(1L)).thenReturn(contributor);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(viewMapper.toUserSummary(contributor)).thenReturn(mappedSummary);

        UserSummary result = adminService.approveContributor(100L, 1L);

        assertThat(result).isEqualTo(mappedSummary);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getRole()).isEqualTo(UserRole.CONTRIBUTOR);
        assertThat(savedUser.isContributorApproved()).isTrue();
        assertThat(savedUser.getContributorRejectionReason()).isNull();
        verify(auditLogService).log(any(User.class), contains("Promotion"), contains("Approved"), contains("User"),
                any(Long.class), contains("alice"), contains("Granted contributor access"), contains("Success"));
    }

    @Test
    void rejectContributorShouldRequireReason() {
        User contributor = buildUser(2L, "bob", UserRole.REGISTERED_VIEWER);
        contributor.setContributorApplication("Please approve");
        contributor.setContributorRequestedAt(LocalDateTime.now().minusHours(6));

        when(accessControlService.getUserOrThrow(100L)).thenReturn(admin);
        when(accessControlService.getUserOrThrow(2L)).thenReturn(contributor);

        assertThatThrownBy(() -> adminService.rejectContributor(100L, 2L, new ContributorDecisionRequest("   ")))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiException.getMessage()).isEqualTo("Rejection reason is required");
                });

        verify(userRepository, never()).save(any(User.class));
        verify(auditLogService, never()).log(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void createCategoryShouldRejectDuplicateName() {
        when(accessControlService.getUserOrThrow(100L)).thenReturn(admin);
        when(categoryRepository.findByNameIgnoreCase("History")).thenReturn(Optional.of(new Category("History", "Existing")));

        assertThatThrownBy(() -> adminService.createCategory(100L, new CreateCategoryRequest(" History ", "Museums")))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(apiException.getMessage()).isEqualTo("Category already exists");
                });
    }

    @Test
    void deleteCategoryShouldRejectWhenCategoryIsInUse() {
        Category category = new Category("Architecture", "Buildings");
        category.setCategoryId(9L);

        when(accessControlService.getUserOrThrow(100L)).thenReturn(admin);
        when(accessControlService.getCategoryOrThrow(9L)).thenReturn(category);
        when(resourceEntryRepository.countByCategoryCategoryId(9L)).thenReturn(3L);

        assertThatThrownBy(() -> adminService.deleteCategory(100L, 9L))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiException.getMessage()).isEqualTo("Category is in use and cannot be deleted");
                });

        verify(categoryRepository, never()).delete(any(Category.class));
    }

    @Test
    void archiveShouldSetArchivedStatusAndTimestamp() {
        ResourceEntry entry = new ResourceEntry();
        entry.setResourceId(55L);
        entry.setTitle("Guide");
        entry.setStatus(ResourceStatus.APPROVED);
        ResourceDetail mappedDetail = new ResourceDetail(
                55L, "Guide", "History", "Suzhou", "desc", "file", null, null, "copyright",
                ResourceStatus.ARCHIVED, null, 1L, "alice", 2L, "History", Set.of(),
                null, null, null, null, LocalDateTime.now());

        when(accessControlService.getUserOrThrow(100L)).thenReturn(admin);
        when(accessControlService.getResourceOrThrow(55L)).thenReturn(entry);
        when(resourceEntryRepository.save(any(ResourceEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(viewMapper.toResourceDetail(any(ResourceEntry.class))).thenReturn(mappedDetail);

        ResourceDetail result = adminService.archive(100L, 55L);

        assertThat(result).isEqualTo(mappedDetail);
        verify(resourceEntryRepository).save(resourceCaptor.capture());
        ResourceEntry savedEntry = resourceCaptor.getValue();
        assertThat(savedEntry.getStatus()).isEqualTo(ResourceStatus.ARCHIVED);
        assertThat(savedEntry.getArchivedAt()).isNotNull();
        verify(auditLogService).log(any(User.class), contains("Archive"), contains("Archived resource"), contains("Resource"),
                any(Long.class), contains("Guide"), contains("Moved resource into archive"), contains("Success"));
    }

    private User buildUser(Long id, String userName, UserRole role) {
        User user = new User();
        user.setUserId(id);
        user.setUserName(userName);
        user.setEmail(userName + "@example.com");
        user.setPassword("encoded");
        user.setRole(role);
        return user;
    }
}
