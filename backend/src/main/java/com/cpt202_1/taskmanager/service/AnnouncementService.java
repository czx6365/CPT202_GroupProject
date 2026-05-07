package com.cpt202_1.taskmanager.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.cpt202_1.taskmanager.dto.request.AnnouncementStatusRequest;
import com.cpt202_1.taskmanager.dto.request.AnnouncementUpsertRequest;
import com.cpt202_1.taskmanager.dto.response.AnnouncementView;
import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.Announcement;
import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.AnnouncementStatus;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.AnnouncementRepository;

import jakarta.persistence.criteria.Predicate;

@Service
@Transactional
public class AnnouncementService {
    private final AccessControlService accessControlService;
    private final AnnouncementRepository announcementRepository;
    private final AuditLogService auditLogService;

    public AnnouncementService(
            AccessControlService accessControlService,
            AnnouncementRepository announcementRepository,
            AuditLogService auditLogService) {
        this.accessControlService = accessControlService;
        this.announcementRepository = announcementRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<AnnouncementView> listAnnouncements(Long actorId, String keyword, String audience, AnnouncementStatus status) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);

        Specification<Announcement> specification = (root, query, builder) -> {
            Predicate predicate = builder.conjunction();

            if (StringUtils.hasText(keyword)) {
                String normalizedKeyword = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("title")), normalizedKeyword),
                        builder.like(builder.lower(root.get("content")), normalizedKeyword)));
            }

            if (StringUtils.hasText(audience)) {
                predicate = builder.and(
                        predicate,
                        builder.equal(builder.lower(root.get("audience")), audience.trim().toLowerCase()));
            }

            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }

            return predicate;
        };

        return announcementRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
                .map(this::toView)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnnouncementView> listPublishedAnnouncementsForUser(Long actorId) {
        User actor = accessControlService.getUserOrThrow(actorId);

        Specification<Announcement> specification = (root, query, builder) -> {
            Predicate published = builder.equal(root.get("status"), AnnouncementStatus.PUBLISHED);
            Predicate sharedAudience = root.get("audience").in("PUBLIC", "ALL_USERS");

            if (actor.getRole() == UserRole.CONTRIBUTOR && actor.isContributorApproved()) {
                return builder.and(published, builder.or(sharedAudience, builder.equal(root.get("audience"), "CONTRIBUTORS")));
            }

            return builder.and(published, sharedAudience);
        };

        return announcementRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
                .map(this::toView)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnnouncementView> listPublicAnnouncements() {
        Specification<Announcement> specification = (root, query, builder) -> builder.and(
                builder.equal(root.get("status"), AnnouncementStatus.PUBLISHED),
                builder.equal(root.get("audience"), "PUBLIC"));

        return announcementRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
                .map(this::toView)
                .toList();
    }

    public AnnouncementView createAnnouncement(Long actorId, AnnouncementUpsertRequest request) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);

        Announcement announcement = new Announcement();
        announcement.setCreatedBy(actor);
        fillAnnouncement(announcement, request);
        Announcement saved = announcementRepository.save(announcement);

        auditLogService.log(
                actor,
                "Announcements",
                "Created announcement",
                "Announcement",
                saved.getAnnouncementId(),
                saved.getTitle(),
                "Created announcement draft for " + saved.getAudience(),
                "Success");

        return toView(saved);
    }

    public AnnouncementView updateAnnouncement(Long actorId, Long announcementId, AnnouncementUpsertRequest request) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);

        Announcement announcement = getAnnouncementOrThrow(announcementId);
        fillAnnouncement(announcement, request);
        Announcement saved = announcementRepository.save(announcement);

        auditLogService.log(
                actor,
                "Announcements",
                "Updated announcement",
                "Announcement",
                saved.getAnnouncementId(),
                saved.getTitle(),
                "Updated announcement content for " + saved.getAudience(),
                "Success");

        return toView(saved);
    }

    public AnnouncementView updateAnnouncementStatus(Long actorId, Long announcementId, AnnouncementStatusRequest request) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);
        if (request == null || request.status() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Announcement status is required");
        }

        Announcement announcement = getAnnouncementOrThrow(announcementId);
        announcement.setStatus(request.status());
        Announcement saved = announcementRepository.save(announcement);

        auditLogService.log(
                actor,
                "Announcements",
                "Updated announcement status",
                "Announcement",
                saved.getAnnouncementId(),
                saved.getTitle(),
                "Changed announcement status to " + saved.getStatus(),
                "Success");

        return toView(saved);
    }

    private void fillAnnouncement(Announcement announcement, AnnouncementUpsertRequest request) {
        if (request == null || !StringUtils.hasText(request.title())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Announcement title is required");
        }
        if (request == null || !StringUtils.hasText(request.content())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Announcement content is required");
        }
        if (request == null || !StringUtils.hasText(request.audience())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Announcement audience is required");
        }

        announcement.setTitle(request.title().trim());
        announcement.setContent(request.content().trim());
        announcement.setAudience(request.audience().trim());
        if (announcement.getStatus() == null) {
            announcement.setStatus(AnnouncementStatus.DRAFT);
        }
    }

    private Announcement getAnnouncementOrThrow(Long announcementId) {
        return announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Announcement not found: " + announcementId));
    }

    private AnnouncementView toView(Announcement announcement) {
        return new AnnouncementView(
                announcement.getAnnouncementId(),
                announcement.getTitle(),
                announcement.getContent(),
                announcement.getAudience(),
                announcement.getStatus(),
                announcement.getCreatedAt(),
                announcement.getUpdatedAt(),
                announcement.getCreatedBy().getUserId(),
                announcement.getCreatedBy().getUserName());
    }
}
