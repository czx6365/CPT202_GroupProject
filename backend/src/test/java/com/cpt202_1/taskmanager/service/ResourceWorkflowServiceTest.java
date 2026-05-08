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

import com.cpt202_1.taskmanager.dto.request.ResourceUpsertRequest;
import com.cpt202_1.taskmanager.dto.request.ReviewRequest;
import com.cpt202_1.taskmanager.dto.response.ResourceDetail;
import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.Category;
import com.cpt202_1.taskmanager.pojo.ResourceEntry;
import com.cpt202_1.taskmanager.pojo.Tag;
import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.ResourceStatus;
import com.cpt202_1.taskmanager.pojo.enums.ReviewDecision;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.ResourceEntryRepository;
import com.cpt202_1.taskmanager.repository.TagRepository;

@ExtendWith(MockitoExtension.class)
class ResourceWorkflowServiceTest {

    @Mock
    private AccessControlService accessControlService;

    @Mock
    private ResourceEntryRepository resourceEntryRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private PlatformViewMapper viewMapper;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ResourceWorkflowService resourceWorkflowService;

    @Captor
    private ArgumentCaptor<ResourceEntry> resourceCaptor;

    private User approvedContributor;
    private User admin;

    @BeforeEach
    void setUp() {
        approvedContributor = buildUser(1L, "alice", UserRole.CONTRIBUTOR);
        approvedContributor.setContributorApproved(true);
        admin = buildUser(99L, "admin", UserRole.ADMIN_REVIEWER);
    }

    @Test
    void createDraftShouldNormalizeFieldsResolveTagsAndPersistDraft() {
        Category category = new Category("History", "Museums");
        category.setCategoryId(2L);
        Tag tag = new Tag("museum");
        tag.setTagId(10L);
        ResourceDetail mappedDetail = detailWithStatus(ResourceStatus.DRAFT);

        when(accessControlService.getUserOrThrow(1L)).thenReturn(approvedContributor);
        when(accessControlService.getCategoryOrThrow(2L)).thenReturn(category);
        when(tagRepository.findByNameIgnoreCase("museum")).thenReturn(Optional.of(tag));
        when(resourceEntryRepository.save(any(ResourceEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(viewMapper.toResourceDetail(any(ResourceEntry.class))).thenReturn(mappedDetail);

        ResourceDetail result = resourceWorkflowService.createDraft(1L, validUpsertRequest());

        assertThat(result).isEqualTo(mappedDetail);
        verify(resourceEntryRepository).save(resourceCaptor.capture());
        ResourceEntry savedEntry = resourceCaptor.getValue();
        assertThat(savedEntry.getStatus()).isEqualTo(ResourceStatus.DRAFT);
        assertThat(savedEntry.getTitle()).isEqualTo("Suzhou Museum Guide");
        assertThat(savedEntry.getTopic()).isEqualTo("Local history");
        assertThat(savedEntry.getFileUrl()).isEqualTo("https://files.example.com/upload.png");
        assertThat(savedEntry.getFileLinkUrl()).isEqualTo("https://files.example.com/guide.pdf");
        assertThat(savedEntry.getCategory()).isEqualTo(category);
        assertThat(savedEntry.getTags()).containsExactly(tag);
    }

    @Test
    void submitForReviewShouldRejectUnapprovedContributor() {
        User pendingContributor = buildUser(2L, "bob", UserRole.CONTRIBUTOR);
        pendingContributor.setContributorApproved(false);
        ResourceEntry entry = buildReviewReadyEntry(pendingContributor, ResourceStatus.DRAFT);

        when(accessControlService.getUserOrThrow(2L)).thenReturn(pendingContributor);
        when(accessControlService.getResourceOrThrow(5L)).thenReturn(entry);

        assertThatThrownBy(() -> resourceWorkflowService.submitForReview(2L, 5L))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(apiException.getMessage()).isEqualTo("Contributor is not approved by admin");
                });

        verify(resourceEntryRepository, never()).save(any(ResourceEntry.class));
    }

    @Test
    void submitForReviewShouldRejectWhenCategoryIsMissing() {
        ResourceEntry entry = buildReviewReadyEntry(approvedContributor, ResourceStatus.DRAFT);
        entry.setCategory(null);

        when(accessControlService.getUserOrThrow(1L)).thenReturn(approvedContributor);
        when(accessControlService.getResourceOrThrow(5L)).thenReturn(entry);

        assertThatThrownBy(() -> resourceWorkflowService.submitForReview(1L, 5L))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiException.getMessage()).isEqualTo("categoryId is required before submission");
                });
    }

    @Test
    void submitForReviewShouldMoveDraftToPendingAndClearReviewMetadata() {
        ResourceEntry entry = buildReviewReadyEntry(approvedContributor, ResourceStatus.REJECTED);
        entry.setReviewer(admin);
        entry.setReviewedAt(LocalDateTime.now().minusDays(1));
        entry.setReviewerFeedback("Old feedback");
        ResourceDetail mappedDetail = detailWithStatus(ResourceStatus.PENDING_REVIEW);

        when(accessControlService.getUserOrThrow(1L)).thenReturn(approvedContributor);
        when(accessControlService.getResourceOrThrow(5L)).thenReturn(entry);
        when(resourceEntryRepository.save(any(ResourceEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(viewMapper.toResourceDetail(any(ResourceEntry.class))).thenReturn(mappedDetail);

        ResourceDetail result = resourceWorkflowService.submitForReview(1L, 5L);

        assertThat(result).isEqualTo(mappedDetail);
        verify(resourceEntryRepository).save(resourceCaptor.capture());
        ResourceEntry savedEntry = resourceCaptor.getValue();
        assertThat(savedEntry.getStatus()).isEqualTo(ResourceStatus.PENDING_REVIEW);
        assertThat(savedEntry.getReviewer()).isNull();
        assertThat(savedEntry.getReviewedAt()).isNull();
        assertThat(savedEntry.getReviewerFeedback()).isNull();
    }

    @Test
    void resubmitShouldRejectWhenResourceIsNotRejected() {
        ResourceEntry entry = buildReviewReadyEntry(approvedContributor, ResourceStatus.DRAFT);

        when(accessControlService.getUserOrThrow(1L)).thenReturn(approvedContributor);
        when(accessControlService.getResourceOrThrow(5L)).thenReturn(entry);

        assertThatThrownBy(() -> resourceWorkflowService.resubmit(1L, 5L))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiException.getMessage()).isEqualTo("Only rejected resources can be resubmitted");
                });
    }

    @Test
    void reviewShouldRequireFeedbackWhenRejecting() {
        ResourceEntry entry = buildReviewReadyEntry(approvedContributor, ResourceStatus.PENDING_REVIEW);

        when(accessControlService.getUserOrThrow(99L)).thenReturn(admin);
        when(accessControlService.getResourceOrThrow(5L)).thenReturn(entry);

        assertThatThrownBy(() -> resourceWorkflowService.review(99L, 5L, new ReviewRequest(ReviewDecision.REJECT, "  ")))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiException.getMessage()).isEqualTo("Feedback is required when rejecting a resource");
                });

        verify(resourceEntryRepository, never()).save(any(ResourceEntry.class));
    }

    @Test
    void reviewShouldApprovePendingResourceAndSetPublishedTimestamp() {
        ResourceEntry entry = buildReviewReadyEntry(approvedContributor, ResourceStatus.PENDING_REVIEW);
        ResourceDetail mappedDetail = detailWithStatus(ResourceStatus.APPROVED);

        when(accessControlService.getUserOrThrow(99L)).thenReturn(admin);
        when(accessControlService.getResourceOrThrow(5L)).thenReturn(entry);
        when(resourceEntryRepository.save(any(ResourceEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(viewMapper.toResourceDetail(any(ResourceEntry.class))).thenReturn(mappedDetail);

        ResourceDetail result = resourceWorkflowService.review(99L, 5L, new ReviewRequest(ReviewDecision.APPROVE, null));

        assertThat(result).isEqualTo(mappedDetail);
        verify(resourceEntryRepository).save(resourceCaptor.capture());
        ResourceEntry savedEntry = resourceCaptor.getValue();
        assertThat(savedEntry.getStatus()).isEqualTo(ResourceStatus.APPROVED);
        assertThat(savedEntry.getReviewer()).isEqualTo(admin);
        assertThat(savedEntry.getReviewedAt()).isNotNull();
        assertThat(savedEntry.getPublishedAt()).isNotNull();
        assertThat(savedEntry.getReviewerFeedback()).isNull();
        verify(auditLogService).log(any(User.class), contains("Review"), contains("Approved resource"), contains("Resource"),
                any(Long.class), contains("Suzhou Museum Guide"), contains("No feedback recorded"), contains("Success"));
    }

    private ResourceUpsertRequest validUpsertRequest() {
        return new ResourceUpsertRequest(
                "  Suzhou Museum Guide  ",
                "  Local history  ",
                "  Suzhou  ",
                "  A curated guide  ",
                2L,
                Set.of(" museum "),
                "  https://files.example.com/upload.png  ",
                "  https://files.example.com/guide.pdf  ",
                null,
                "  Original work  ");
    }

    private ResourceEntry buildReviewReadyEntry(User contributor, ResourceStatus status) {
        Category category = new Category("History", "Museums");
        category.setCategoryId(2L);

        ResourceEntry entry = new ResourceEntry();
        entry.setResourceId(5L);
        entry.setContributor(contributor);
        entry.setStatus(status);
        entry.setTitle("Suzhou Museum Guide");
        entry.setTopic("Local history");
        entry.setPlaceName("Suzhou");
        entry.setDescription("A curated guide");
        entry.setFileUrl("https://files.example.com/guide.pdf");
        entry.setCopyrightDeclaration("Original work");
        entry.setCategory(category);
        return entry;
    }

    private ResourceDetail detailWithStatus(ResourceStatus status) {
        return new ResourceDetail(
                5L,
                "Suzhou Museum Guide",
                "Local history",
                "Suzhou",
                "A curated guide",
                "https://files.example.com/guide.pdf",
                null,
                null,
                "Original work",
                status,
                null,
                1L,
                "alice",
                2L,
                "History",
                Set.of("museum"),
                null,
                null,
                null,
                null,
                null);
    }

    private User buildUser(Long id, String userName, UserRole role) {
        User user = new User();
        user.setUserId(id);
        user.setUserName(userName);
        user.setEmail(userName + "@example.com");
        user.setPassword("encoded");
        user.setRole(role);
        user.setEnabled(true);
        return user;
    }
}
