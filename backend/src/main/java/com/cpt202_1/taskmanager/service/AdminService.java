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
import com.cpt202_1.taskmanager.dto.response.CategoryView;
import com.cpt202_1.taskmanager.dto.response.ResourceDetail;
import com.cpt202_1.taskmanager.dto.response.TagView;
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

    public Category updateCategory(Long actorId, Long categoryId, CreateCategoryRequest request) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);
        if (request == null || !StringUtils.hasText(request.name())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Category name is required");
        }

        Category category = accessControlService.getCategoryOrThrow(categoryId);
        String nextName = request.name().trim();
        categoryRepository.findByNameIgnoreCase(nextName)
                .filter(existing -> !existing.getCategoryId().equals(categoryId))
                .ifPresent(existing -> {
                    throw new ApiException(HttpStatus.CONFLICT, "Category already exists");
                });

        category.setName(nextName);
        category.setDescription(StringUtils.hasText(request.description()) ? request.description().trim() : null);
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long actorId, Long categoryId) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);

        Category category = accessControlService.getCategoryOrThrow(categoryId);
        long usageCount = resourceEntryRepository.countByCategoryCategoryId(categoryId);
        if (usageCount > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Category is in use and cannot be deleted");
        }

        categoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryView> listCategories() {
        return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                .map(category -> {
                    long usageCount = resourceEntryRepository.countByCategoryCategoryId(category.getCategoryId());
                    return new CategoryView(
                            category.getCategoryId(),
                            category.getName(),
                            category.getDescription(),
                            usageCount,
                            usageCount > 0);
                })
                .toList();
    }

    public TagView createTag(Long actorId, CreateTagRequest request) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);
        if (request == null || !StringUtils.hasText(request.name())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tag name is required");
        }

        String name = request.name().trim();
        if (tagRepository.findByNameIgnoreCase(name).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Tag already exists");
        }

        Tag tag = tagRepository.save(new Tag(name));
        return new TagView(tag.getTagId(), tag.getName(), 0, false);
    }

    public TagView updateTag(Long actorId, Long tagId, CreateTagRequest request) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);
        if (request == null || !StringUtils.hasText(request.name())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tag name is required");
        }

        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tag not found: " + tagId));
        String nextName = request.name().trim();
        tagRepository.findByNameIgnoreCase(nextName)
                .filter(existing -> !existing.getTagId().equals(tagId))
                .ifPresent(existing -> {
                    throw new ApiException(HttpStatus.CONFLICT, "Tag already exists");
                });

        tag.setName(nextName);
        Tag saved = tagRepository.save(tag);
        long usageCount = resourceEntryRepository.countByTagsTagId(saved.getTagId());
        return new TagView(saved.getTagId(), saved.getName(), usageCount, usageCount > 0);
    }

    public void deleteTag(Long actorId, Long tagId) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);

        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tag not found: " + tagId));
        long usageCount = resourceEntryRepository.countByTagsTagId(tagId);
        if (usageCount > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tag is in use and cannot be deleted");
        }

        tagRepository.delete(tag);
    }

    @Transactional(readOnly = true)
    public List<TagView> listTags() {
        return tagRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                .map(tag -> {
                    long usageCount = resourceEntryRepository.countByTagsTagId(tag.getTagId());
                    return new TagView(tag.getTagId(), tag.getName(), usageCount, usageCount > 0);
                })
                .toList();
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
        if (entry.getStatus() != ResourceStatus.APPROVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only approved resources can be archived");
        }
        entry.setStatus(ResourceStatus.ARCHIVED);
        entry.setArchivedAt(LocalDateTime.now());
        return viewMapper.toResourceDetail(resourceEntryRepository.save(entry));
    }

    public ResourceDetail restore(Long actorId, Long resourceId) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);

        ResourceEntry entry = accessControlService.getResourceOrThrow(resourceId);
        if (entry.getStatus() != ResourceStatus.ARCHIVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only archived resources can be restored");
        }

        entry.setStatus(ResourceStatus.APPROVED);
        entry.setArchivedAt(null);
        if (entry.getPublishedAt() == null) {
            entry.setPublishedAt(LocalDateTime.now());
        }
        return viewMapper.toResourceDetail(resourceEntryRepository.save(entry));
    }
}
