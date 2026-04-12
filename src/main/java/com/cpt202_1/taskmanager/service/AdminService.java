package com.cpt202_1.taskmanager.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.cpt202_1.taskmanager.dto.request.ContributorDecisionRequest;
import com.cpt202_1.taskmanager.dto.request.CreateCategoryRequest;
import com.cpt202_1.taskmanager.dto.request.CreateTagRequest;
import com.cpt202_1.taskmanager.dto.response.ResourceDetail;
import com.cpt202_1.taskmanager.dto.response.UserSummary;
import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.Category;
import com.cpt202_1.taskmanager.pojo.ResourceEntry;
import com.cpt202_1.taskmanager.pojo.Tag;
import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.ResourceStatus;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.CategoryRepository;
import com.cpt202_1.taskmanager.repository.ResourceEntryRepository;
import com.cpt202_1.taskmanager.repository.TagRepository;
import com.cpt202_1.taskmanager.repository.UserRepository;

@Service
@Transactional
public class AdminService {
    private final AccessControlService accessControlService;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final ResourceEntryRepository resourceEntryRepository;
    private final PlatformViewMapper viewMapper;

    public AdminService(
            AccessControlService accessControlService,
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            TagRepository tagRepository,
            ResourceEntryRepository resourceEntryRepository,
            PlatformViewMapper viewMapper) {
        this.accessControlService = accessControlService;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.resourceEntryRepository = resourceEntryRepository;
        this.viewMapper = viewMapper;
    }

    public UserSummary approveContributor(Long actorId, Long contributorId) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);

        User contributor = accessControlService.getUserOrThrow(contributorId);
        if (!StringUtils.hasText(contributor.getContributorApplication()) || contributor.getContributorRequestedAt() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Target user has not submitted a contributor application");
        }
        if (contributor.isContributorApproved()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Target user is already an approved contributor");
        }

        contributor.setRole(UserRole.CONTRIBUTOR);
        contributor.setContributorApproved(true);
        contributor.setContributorRejectionReason(null);
        userRepository.save(contributor);
        return viewMapper.toUserSummary(contributor);
    }

    public UserSummary rejectContributor(Long actorId, Long contributorId, ContributorDecisionRequest request) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);

        User contributor = accessControlService.getUserOrThrow(contributorId);
        if (!StringUtils.hasText(contributor.getContributorApplication()) || contributor.getContributorRequestedAt() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Target user has not submitted a contributor application");
        }
        if (contributor.isContributorApproved()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Approved contributor applications cannot be rejected");
        }
        if (request == null || !StringUtils.hasText(request.reason())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Rejection reason is required");
        }

        contributor.setRole(UserRole.REGISTERED_VIEWER);
        contributor.setContributorApproved(false);
        contributor.setContributorApplication(null);
        contributor.setContributorRequestedAt(null);
        contributor.setContributorRejectionReason(request.reason().trim());
        userRepository.save(contributor);
        return viewMapper.toUserSummary(contributor);
    }

    public Category createCategory(Long actorId, CreateCategoryRequest request) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);
        if (request == null || !StringUtils.hasText(request.name())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Category name is required");
        }

        String name = request.name().trim();
        if (categoryRepository.findByNameIgnoreCase(name).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Category already exists");
        }

        Category category = new Category(name, request.description());
        return categoryRepository.save(category);
    }

    @Transactional(readOnly = true)
    public List<Category> listCategories() {
        return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
    }

    public Tag createTag(Long actorId, CreateTagRequest request) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);
        if (request == null || !StringUtils.hasText(request.name())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tag name is required");
        }

        String name = request.name().trim();
        if (tagRepository.findByNameIgnoreCase(name).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Tag already exists");
        }

        Tag tag = new Tag(name);
        return tagRepository.save(tag);
    }

    @Transactional(readOnly = true)
    public List<Tag> listTags() {
        return tagRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
    }

    @Transactional(readOnly = true)
    public List<UserSummary> listPendingContributors(Long actorId) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);

        return userRepository.findAll().stream()
                .filter(user -> StringUtils.hasText(user.getContributorApplication()))
                .filter(user -> user.getContributorRequestedAt() != null)
                .filter(user -> !user.isContributorApproved())
                .map(viewMapper::toUserSummary)
                .toList();
    }

    public ResourceDetail archive(Long actorId, Long resourceId) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);

        ResourceEntry entry = accessControlService.getResourceOrThrow(resourceId);
        entry.setStatus(ResourceStatus.ARCHIVED);
        entry.setArchivedAt(LocalDateTime.now());
        return viewMapper.toResourceDetail(resourceEntryRepository.save(entry));
    }
}
