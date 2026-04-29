package com.cpt202_1.taskmanager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.cpt202_1.taskmanager.dto.request.CommentRequest;
import com.cpt202_1.taskmanager.dto.response.CommentView;
import com.cpt202_1.taskmanager.dto.response.ResourceDetail;
import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.ResourceComment;
import com.cpt202_1.taskmanager.pojo.ResourceEntry;
import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.ResourceStatus;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.ResourceCommentRepository;
import com.cpt202_1.taskmanager.repository.ResourceEntryRepository;

@ExtendWith(MockitoExtension.class)
class ResourceCatalogServiceTest {

    @Mock
    private AccessControlService accessControlService;

    @Mock
    private ResourceEntryRepository resourceEntryRepository;

    @Mock
    private ResourceCommentRepository resourceCommentRepository;

    @Mock
    private PlatformViewMapper viewMapper;

    @InjectMocks
    private ResourceCatalogService resourceCatalogService;

    @Captor
    private ArgumentCaptor<ResourceComment> commentCaptor;

    private User viewer;

    @BeforeEach
    void setUp() {
        viewer = new User();
        viewer.setUserId(1L);
        viewer.setUserName("alice");
        viewer.setEmail("alice@example.com");
        viewer.setPassword("encoded");
        viewer.setRole(UserRole.REGISTERED_VIEWER);
        viewer.setEnabled(true);
    }

    @Test
    void getApprovedDetailShouldRejectNonApprovedResource() {
        ResourceEntry entry = buildResource(ResourceStatus.ARCHIVED);
        when(accessControlService.getResourceOrThrow(7L)).thenReturn(entry);

        assertThatThrownBy(() -> resourceCatalogService.getApprovedDetail(7L))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(apiException.getMessage()).isEqualTo("Resource not found");
                });
    }

    @Test
    void addCommentShouldRejectBlankContent() {
        ResourceEntry entry = buildResource(ResourceStatus.APPROVED);

        when(accessControlService.getUserOrThrow(1L)).thenReturn(viewer);
        when(accessControlService.getResourceOrThrow(7L)).thenReturn(entry);

        assertThatThrownBy(() -> resourceCatalogService.addComment(1L, 7L, new CommentRequest("   ")))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiException.getMessage()).isEqualTo("Comment content is required");
                });

        verify(resourceCommentRepository, never()).save(any(ResourceComment.class));
    }

    @Test
    void addCommentShouldRejectNonApprovedResource() {
        ResourceEntry entry = buildResource(ResourceStatus.REJECTED);

        when(accessControlService.getUserOrThrow(1L)).thenReturn(viewer);
        when(accessControlService.getResourceOrThrow(7L)).thenReturn(entry);

        assertThatThrownBy(() -> resourceCatalogService.addComment(1L, 7L, new CommentRequest("Looks good")))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiException.getMessage()).isEqualTo("Comments are only allowed on approved resources");
                });
    }

    @Test
    void addCommentShouldSaveTrimmedContentForApprovedResource() {
        ResourceEntry entry = buildResource(ResourceStatus.APPROVED);
        CommentView mappedView = new CommentView(10L, 1L, "alice", "Great guide", LocalDateTime.now());

        when(accessControlService.getUserOrThrow(1L)).thenReturn(viewer);
        when(accessControlService.getResourceOrThrow(7L)).thenReturn(entry);
        when(resourceCommentRepository.save(any(ResourceComment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(viewMapper.toCommentView(any(ResourceComment.class))).thenReturn(mappedView);

        CommentView result = resourceCatalogService.addComment(1L, 7L, new CommentRequest("  Great guide  "));

        assertThat(result).isEqualTo(mappedView);
        verify(resourceCommentRepository).save(commentCaptor.capture());
        ResourceComment savedComment = commentCaptor.getValue();
        assertThat(savedComment.getAuthor()).isEqualTo(viewer);
        assertThat(savedComment.getResource()).isEqualTo(entry);
        assertThat(savedComment.getContent()).isEqualTo("Great guide");
    }

    @Test
    void listCommentsShouldRejectNonApprovedResource() {
        ResourceEntry entry = buildResource(ResourceStatus.DRAFT);
        when(accessControlService.getResourceOrThrow(7L)).thenReturn(entry);

        assertThatThrownBy(() -> resourceCatalogService.listComments(7L))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(apiException.getMessage()).isEqualTo("Resource not found");
                });
    }

    @Test
    void listCommentsShouldMapApprovedResourceComments() {
        ResourceEntry entry = buildResource(ResourceStatus.APPROVED);
        ResourceComment comment = new ResourceComment();
        comment.setCommentId(11L);
        comment.setAuthor(viewer);
        comment.setResource(entry);
        comment.setContent("Helpful");
        CommentView mappedView = new CommentView(11L, 1L, "alice", "Helpful", LocalDateTime.now());

        when(accessControlService.getResourceOrThrow(7L)).thenReturn(entry);
        when(resourceCommentRepository.findByResourceResourceIdOrderByCreatedAtAsc(7L)).thenReturn(List.of(comment));
        when(viewMapper.toCommentView(comment)).thenReturn(mappedView);

        List<CommentView> result = resourceCatalogService.listComments(7L);

        assertThat(result).containsExactly(mappedView);
    }

    private ResourceEntry buildResource(ResourceStatus status) {
        ResourceEntry entry = new ResourceEntry();
        entry.setResourceId(7L);
        entry.setStatus(status);
        entry.setTitle("Guide");
        return entry;
    }
}
