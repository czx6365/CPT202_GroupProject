package com.cpt202_1.taskmanager.service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.cpt202_1.taskmanager.dto.request.ResourceUpsertRequest;
import com.cpt202_1.taskmanager.dto.request.ReviewRequest;
import com.cpt202_1.taskmanager.dto.response.ResourceDetail;
import com.cpt202_1.taskmanager.dto.response.ResourceSummary;
import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.ResourceEntry;
import com.cpt202_1.taskmanager.pojo.Tag;
import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.ResourceStatus;
import com.cpt202_1.taskmanager.pojo.enums.ReviewDecision;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.ResourceEntryRepository;
import com.cpt202_1.taskmanager.repository.TagRepository;

@Service
@Transactional
public class ResourceWorkflowService {
    private final AccessControlService accessControlService;
    private final ResourceEntryRepository resourceEntryRepository;
    private final TagRepository tagRepository;
    private final PlatformViewMapper viewMapper;

    public ResourceWorkflowService(
            AccessControlService accessControlService,
            ResourceEntryRepository resourceEntryRepository,
            TagRepository tagRepository,
            PlatformViewMapper viewMapper) {
        this.accessControlService = accessControlService;
        this.resourceEntryRepository = resourceEntryRepository;
        this.tagRepository = tagRepository;
        this.viewMapper = viewMapper;
    }

    public ResourceDetail createDraft(Long actorId, ResourceUpsertRequest request) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.CONTRIBUTOR);

        ResourceEntry entry = new ResourceEntry();
        entry.setContributor(actor);
        entry.setStatus(ResourceStatus.DRAFT);
        fillResourceFields(entry, request);

        return viewMapper.toResourceDetail(resourceEntryRepository.save(entry));
    }

    public ResourceDetail updateDraft(Long actorId, Long resourceId, ResourceUpsertRequest request) {
        User actor = accessControlService.getUserOrThrow(actorId);
        ResourceEntry entry = accessControlService.getResourceOrThrow(resourceId);

        accessControlService.requireOwner(actor, entry);
        if (entry.getStatus() != ResourceStatus.DRAFT && entry.getStatus() != ResourceStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only draft/rejected resources can be edited");
        }

        fillResourceFields(entry, request);
        return viewMapper.toResourceDetail(resourceEntryRepository.save(entry));
    }

    public ResourceDetail submitForReview(Long actorId, Long resourceId) {
        User actor = accessControlService.getUserOrThrow(actorId);
        ResourceEntry entry = accessControlService.getResourceOrThrow(resourceId);

        accessControlService.requireOwner(actor, entry);
        accessControlService.requireRole(actor, UserRole.CONTRIBUTOR);
        if (!actor.isContributorApproved()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Contributor is not approved by admin");
        }
        if (entry.getStatus() != ResourceStatus.DRAFT && entry.getStatus() != ResourceStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only draft/rejected resources can be submitted");
        }

        entry.setStatus(ResourceStatus.PENDING_REVIEW);
        entry.setReviewer(null);
        entry.setReviewedAt(null);
        entry.setReviewerFeedback(null);
        return viewMapper.toResourceDetail(resourceEntryRepository.save(entry));
    }

    public ResourceDetail resubmit(Long actorId, Long resourceId) {
        User actor = accessControlService.getUserOrThrow(actorId);
        ResourceEntry entry = accessControlService.getResourceOrThrow(resourceId);

        accessControlService.requireOwner(actor, entry);
        accessControlService.requireRole(actor, UserRole.CONTRIBUTOR);
        if (!actor.isContributorApproved()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Contributor is not approved by admin");
        }
        if (entry.getStatus() != ResourceStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only rejected resources can be resubmitted");
        }

        entry.setStatus(ResourceStatus.PENDING_REVIEW);
        entry.setReviewer(null);
        entry.setReviewedAt(null);
        entry.setReviewerFeedback(null);
        return viewMapper.toResourceDetail(resourceEntryRepository.save(entry));
    }

    public ResourceDetail review(Long actorId, Long resourceId, ReviewRequest request) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);
        ResourceEntry entry = accessControlService.getResourceOrThrow(resourceId);

        if (entry.getStatus() != ResourceStatus.PENDING_REVIEW) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only pending resources can be reviewed");
        }
        if (request == null || request.decision() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Review decision is required");
        }

        entry.setReviewer(actor);
        entry.setReviewedAt(LocalDateTime.now());
        entry.setReviewerFeedback(request.feedback());

        if (request.decision() == ReviewDecision.APPROVE) {
            entry.setStatus(ResourceStatus.APPROVED);
            entry.setPublishedAt(LocalDateTime.now());
        } else {
            entry.setStatus(ResourceStatus.REJECTED);
        }

        return viewMapper.toResourceDetail(resourceEntryRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public List<ResourceSummary> listMyResources(Long actorId) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.CONTRIBUTOR);

        return resourceEntryRepository.findByContributorUserIdOrderByUpdatedAtDesc(actor.getUserId()).stream()
                .map(viewMapper::toResourceSummary)
                .toList();
    }

    private void fillResourceFields(ResourceEntry entry, ResourceUpsertRequest request) {
        if (request == null || !StringUtils.hasText(request.title()) || !StringUtils.hasText(request.topic())
                || !StringUtils.hasText(request.placeName()) || !StringUtils.hasText(request.description())
                || !StringUtils.hasText(request.copyrightDeclaration())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "title/topic/placeName/description/copyrightDeclaration are required");
        }

        entry.setTitle(request.title().trim());
        entry.setTopic(request.topic().trim());
        entry.setPlaceName(request.placeName().trim());
        entry.setDescription(request.description().trim());
        entry.setFileUrl(request.fileUrl());
        entry.setExternalLink(request.externalLink());
        entry.setCopyrightDeclaration(request.copyrightDeclaration().trim());
        entry.setCategory(accessControlService.getCategoryOrThrow(request.categoryId()));
        entry.setTags(resolveTags(request.tags()));
    }

    private Set<Tag> resolveTags(Set<String> names) {
        if (names == null || names.isEmpty()) {
            return new HashSet<>();
        }

        Set<Tag> result = new HashSet<>();
        for (String rawName : names) {
            if (!StringUtils.hasText(rawName)) {
                continue;
            }

            String normalized = rawName.trim();
            Tag tag = tagRepository.findByNameIgnoreCase(normalized)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Tag not found: " + normalized));
            result.add(tag);
        }
        return result;
    }
}
