package com.cpt202_1.taskmanager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;

import com.cpt202_1.taskmanager.dto.request.AnnouncementStatusRequest;
import com.cpt202_1.taskmanager.dto.request.AnnouncementUpsertRequest;
import com.cpt202_1.taskmanager.dto.response.AnnouncementView;
import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.Announcement;
import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.AnnouncementStatus;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.AnnouncementRepository;

@ExtendWith(MockitoExtension.class)
class AnnouncementServiceTest {

    @Mock
    private AccessControlService accessControlService;

    @Mock
    private AnnouncementRepository announcementRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AnnouncementService announcementService;

    @Captor
    private ArgumentCaptor<Announcement> announcementCaptor;

    private User admin;

    @BeforeEach
    void setUp() {
        admin = buildUser(100L, "admin", UserRole.ADMIN_REVIEWER, true);
    }

    @Test
    void createAnnouncementShouldTrimFieldsDefaultToDraftAndWriteAuditLog() {
        AnnouncementUpsertRequest request = new AnnouncementUpsertRequest(
                "  Maintenance  ",
                "  Platform will be offline tonight.  ",
                "  PUBLIC  ");

        when(accessControlService.getUserOrThrow(100L)).thenReturn(admin);
        when(announcementRepository.save(any(Announcement.class))).thenAnswer(invocation -> {
            Announcement saved = invocation.getArgument(0);
            saved.setAnnouncementId(9L);
            saved.prePersist();
            return saved;
        });

        AnnouncementView result = announcementService.createAnnouncement(100L, request);

        assertThat(result.announcementId()).isEqualTo(9L);
        assertThat(result.title()).isEqualTo("Maintenance");
        assertThat(result.content()).isEqualTo("Platform will be offline tonight.");
        assertThat(result.audience()).isEqualTo("PUBLIC");
        assertThat(result.status()).isEqualTo(AnnouncementStatus.DRAFT);

        verify(accessControlService).requireRole(admin, UserRole.ADMIN_REVIEWER);
        verify(announcementRepository).save(announcementCaptor.capture());
        Announcement savedAnnouncement = announcementCaptor.getValue();
        assertThat(savedAnnouncement.getCreatedBy()).isSameAs(admin);
        assertThat(savedAnnouncement.getStatus()).isEqualTo(AnnouncementStatus.DRAFT);
        verify(auditLogService).log(any(User.class), contains("Announcements"), contains("Created announcement"),
                contains("Announcement"), any(Long.class), contains("Maintenance"), contains("PUBLIC"), contains("Success"));
    }

    @Test
    void createAnnouncementShouldRejectMissingContent() {
        when(accessControlService.getUserOrThrow(100L)).thenReturn(admin);

        assertThatThrownBy(() -> announcementService.createAnnouncement(
                100L,
                new AnnouncementUpsertRequest("Title", "   ", "PUBLIC")))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiException.getMessage()).isEqualTo("Announcement content is required");
                });

        verify(announcementRepository, never()).save(any(Announcement.class));
        verify(auditLogService, never()).log(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void updateAnnouncementStatusShouldRequireStatus() {
        when(accessControlService.getUserOrThrow(100L)).thenReturn(admin);

        assertThatThrownBy(() -> announcementService.updateAnnouncementStatus(100L, 5L, new AnnouncementStatusRequest(null)))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiException.getMessage()).isEqualTo("Announcement status is required");
                });

        verify(announcementRepository, never()).findById(any(Long.class));
        verify(announcementRepository, never()).save(any(Announcement.class));
    }

    @Test
    void updateAnnouncementStatusShouldPersistAndLogChange() {
        Announcement announcement = buildAnnouncement(5L, "Launch", "PUBLIC", AnnouncementStatus.DRAFT, admin);

        when(accessControlService.getUserOrThrow(100L)).thenReturn(admin);
        when(announcementRepository.findById(5L)).thenReturn(Optional.of(announcement));
        when(announcementRepository.save(any(Announcement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AnnouncementView result = announcementService.updateAnnouncementStatus(
                100L,
                5L,
                new AnnouncementStatusRequest(AnnouncementStatus.PUBLISHED));

        assertThat(result.status()).isEqualTo(AnnouncementStatus.PUBLISHED);
        verify(announcementRepository).save(announcementCaptor.capture());
        assertThat(announcementCaptor.getValue().getStatus()).isEqualTo(AnnouncementStatus.PUBLISHED);
        verify(auditLogService).log(any(User.class), contains("Announcements"), contains("Updated announcement status"),
                contains("Announcement"), any(Long.class), contains("Launch"), contains("PUBLISHED"), contains("Success"));
    }

    @Test
    void listPublicAnnouncementsShouldMapRepositoryResults() {
        Announcement publicNotice = buildAnnouncement(7L, "Visitor note", "PUBLIC", AnnouncementStatus.PUBLISHED, admin);

        when(announcementRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of(publicNotice));

        List<AnnouncementView> result = announcementService.listPublicAnnouncements();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).title()).isEqualTo("Visitor note");
        assertThat(result.get(0).audience()).isEqualTo("PUBLIC");
        verify(announcementRepository).findAll(any(Specification.class), any(Sort.class));
    }

    @Test
    void listPublishedAnnouncementsForApprovedContributorShouldMapContributorAudience() {
        User contributor = buildUser(3L, "alice", UserRole.CONTRIBUTOR, true);
        Announcement contributorNotice = buildAnnouncement(8L, "Contributor note", "CONTRIBUTORS", AnnouncementStatus.PUBLISHED, admin);

        when(accessControlService.getUserOrThrow(3L)).thenReturn(contributor);
        when(announcementRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of(contributorNotice));

        List<AnnouncementView> result = announcementService.listPublishedAnnouncementsForUser(3L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).title()).isEqualTo("Contributor note");
        assertThat(result.get(0).audience()).isEqualTo("CONTRIBUTORS");
        verify(announcementRepository).findAll(any(Specification.class), any(Sort.class));
    }

    private User buildUser(Long id, String userName, UserRole role, boolean contributorApproved) {
        User user = new User();
        user.setUserId(id);
        user.setUserName(userName);
        user.setEmail(userName + "@example.com");
        user.setPassword("encoded");
        user.setRole(role);
        user.setContributorApproved(contributorApproved);
        user.setEnabled(true);
        return user;
    }

    private Announcement buildAnnouncement(
            Long id,
            String title,
            String audience,
            AnnouncementStatus status,
            User createdBy) {
        Announcement announcement = new Announcement();
        announcement.setAnnouncementId(id);
        announcement.setTitle(title);
        announcement.setContent(title + " content");
        announcement.setAudience(audience);
        announcement.setStatus(status);
        announcement.setCreatedBy(createdBy);
        announcement.prePersist();
        return announcement;
    }
}
