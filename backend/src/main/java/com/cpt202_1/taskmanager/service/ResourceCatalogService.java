package com.cpt202_1.taskmanager.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.cpt202_1.taskmanager.dto.request.CommentRequest;
import com.cpt202_1.taskmanager.dto.response.CommentView;
import com.cpt202_1.taskmanager.dto.response.PageResult;
import com.cpt202_1.taskmanager.dto.response.ResourceDetail;
import com.cpt202_1.taskmanager.dto.response.ResourceSummary;
import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.ResourceComment;
import com.cpt202_1.taskmanager.pojo.ResourceEntry;
import com.cpt202_1.taskmanager.pojo.Tag;
import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.ResourceStatus;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.ResourceCommentRepository;
import com.cpt202_1.taskmanager.repository.ResourceEntryRepository;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

@Service
@Transactional
public class ResourceCatalogService {
    private final AccessControlService accessControlService;
    private final ResourceEntryRepository resourceEntryRepository;
    private final ResourceCommentRepository resourceCommentRepository;
    private final PlatformViewMapper viewMapper;

    public ResourceCatalogService(
            AccessControlService accessControlService,
            ResourceEntryRepository resourceEntryRepository,
            ResourceCommentRepository resourceCommentRepository,
            PlatformViewMapper viewMapper) {
        this.accessControlService = accessControlService;
        this.resourceEntryRepository = resourceEntryRepository;
        this.resourceCommentRepository = resourceCommentRepository;
        this.viewMapper = viewMapper;
    }

    @Transactional(readOnly = true)
    public PageResult<ResourceSummary> listPendingResources(
            Long actorId,
            String keyword,
            Long categoryId,
            String place,
            String tag,
            ResourceStatus status,
            int page,
            int size,
            String sortBy,
            String sortDir) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);

        ResourceStatus targetStatus = status == null ? ResourceStatus.PENDING_REVIEW : status;
        Specification<ResourceEntry> specification = buildResourceSpecification(
                keyword, categoryId, place, tag, targetStatus);
        Pageable pageable = buildResourcePageRequest(page, size, sortBy, sortDir);
        Page<ResourceEntry> resultPage = resourceEntryRepository.findAll(specification, pageable);
        return PageResult.from(resultPage, viewMapper::toResourceSummary);
    }

    @Transactional(readOnly = true)
    public PageResult<ResourceSummary> searchApproved(
            String keyword,
            Long categoryId,
            String place,
            String tag,
            int page,
            int size,
            String sortBy,
            String sortDir) {
        Specification<ResourceEntry> specification = buildResourceSpecification(
                keyword, categoryId, place, tag, ResourceStatus.APPROVED);
        Pageable pageable = buildResourcePageRequest(page, size, sortBy, sortDir);
        Page<ResourceEntry> resultPage = resourceEntryRepository.findAll(specification, pageable);
        return PageResult.from(resultPage, viewMapper::toResourceSummary);
    }

    @Transactional(readOnly = true)
    public ResourceDetail getApprovedDetail(Long resourceId) {
        ResourceEntry entry = accessControlService.getResourceOrThrow(resourceId);
        if (entry.getStatus() != ResourceStatus.APPROVED) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Resource not found");
        }
        return viewMapper.toResourceDetail(entry);
    }

    public CommentView addComment(Long actorId, Long resourceId, CommentRequest request) {
        User actor = accessControlService.getUserOrThrow(actorId);
        if (!actor.isEnabled()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "User is disabled");
        }

        ResourceEntry entry = accessControlService.getResourceOrThrow(resourceId);
        if (entry.getStatus() != ResourceStatus.APPROVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Comments are only allowed on approved resources");
        }
        if (request == null || !StringUtils.hasText(request.content())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Comment content is required");
        }

        ResourceComment comment = new ResourceComment();
        comment.setAuthor(actor);
        comment.setResource(entry);
        comment.setContent(request.content().trim());
        return viewMapper.toCommentView(resourceCommentRepository.save(comment));
    }

    @Transactional(readOnly = true)
    public List<CommentView> listComments(Long resourceId) {
        ResourceEntry entry = accessControlService.getResourceOrThrow(resourceId);
        if (entry.getStatus() != ResourceStatus.APPROVED) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Resource not found");
        }

        return resourceCommentRepository.findByResourceResourceIdOrderByCreatedAtAsc(resourceId).stream()
                .map(viewMapper::toCommentView)
                .toList();
    }

    private Specification<ResourceEntry> buildResourceSpecification(
            String keyword,
            Long categoryId,
            String place,
            String tag,
            ResourceStatus status) {
        return (root, query, builder) -> {
            query.distinct(true);
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }

            if (StringUtils.hasText(keyword)) {
                String normalizedKeyword = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("title")), normalizedKeyword),
                        builder.like(builder.lower(root.get("description")), normalizedKeyword)));
            }

            if (categoryId != null) {
                predicates.add(builder.equal(root.get("category").get("categoryId"), categoryId));
            }

            if (StringUtils.hasText(place)) {
                String normalizedPlace = "%" + place.trim().toLowerCase() + "%";
                predicates.add(builder.like(builder.lower(root.get("placeName")), normalizedPlace));
            }

            if (StringUtils.hasText(tag)) {
                Join<ResourceEntry, Tag> tagJoin = root.join("tags", JoinType.LEFT);
                predicates.add(builder.equal(builder.lower(tagJoin.get("name")), tag.trim().toLowerCase()));
            }

            return builder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Pageable buildResourcePageRequest(int page, int size, String sortBy, String sortDir) {
        if (page < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "page must be >= 0");
        }
        if (size < 1 || size > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "size must be between 1 and 100");
        }

        Sort.Direction direction = resolveSortDirection(sortDir);
        String sortProperty = resolveResourceSortProperty(sortBy);
        return PageRequest.of(page, size, Sort.by(direction, sortProperty));
    }

    private String resolveResourceSortProperty(String sortBy) {
        if (!StringUtils.hasText(sortBy)) {
            return "updatedAt";
        }

        return switch (sortBy.trim().toLowerCase()) {
            case "createtime", "createdat", "createdtime" -> "createdAt";
            case "updatedtime", "updatedat", "updatetime" -> "updatedAt";
            default -> throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "sortBy must be one of: createTime, updatedTime");
        };
    }

    private Sort.Direction resolveSortDirection(String sortDir) {
        if (!StringUtils.hasText(sortDir) || "desc".equalsIgnoreCase(sortDir)) {
            return Sort.Direction.DESC;
        }
        if ("asc".equalsIgnoreCase(sortDir)) {
            return Sort.Direction.ASC;
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "sortDir must be asc or desc");
    }
}
