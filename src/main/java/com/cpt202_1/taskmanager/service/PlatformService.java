package com.cpt202_1.taskmanager.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.cpt202_1.taskmanager.dto.request.CommentRequest;
import com.cpt202_1.taskmanager.dto.request.CreateCategoryRequest;
import com.cpt202_1.taskmanager.dto.request.CreateTagRequest;
import com.cpt202_1.taskmanager.dto.request.LoginRequest;
import com.cpt202_1.taskmanager.dto.request.RegisterRequest;
import com.cpt202_1.taskmanager.dto.request.ResourceUpsertRequest;
import com.cpt202_1.taskmanager.dto.request.ReviewRequest;
import com.cpt202_1.taskmanager.dto.request.UpdateProfileRequest;
import com.cpt202_1.taskmanager.dto.response.CommentView;
import com.cpt202_1.taskmanager.dto.response.ResourceDetail;
import com.cpt202_1.taskmanager.dto.response.ResourceSummary;
import com.cpt202_1.taskmanager.dto.response.UserSummary;
import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.Category;
import com.cpt202_1.taskmanager.pojo.ResourceComment;
import com.cpt202_1.taskmanager.pojo.ResourceEntry;
import com.cpt202_1.taskmanager.pojo.Tag;
import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.ResourceStatus;
import com.cpt202_1.taskmanager.pojo.enums.ReviewDecision;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.CategoryRepository;
import com.cpt202_1.taskmanager.repository.ResourceCommentRepository;
import com.cpt202_1.taskmanager.repository.ResourceEntryRepository;
import com.cpt202_1.taskmanager.repository.TagRepository;
import com.cpt202_1.taskmanager.repository.UserRepository;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

@Service
@Transactional
public class PlatformService {
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final ResourceEntryRepository resourceEntryRepository;
    private final ResourceCommentRepository resourceCommentRepository;

    public PlatformService(
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            TagRepository tagRepository,
            ResourceEntryRepository resourceEntryRepository,
            ResourceCommentRepository resourceCommentRepository) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.resourceEntryRepository = resourceEntryRepository;
        this.resourceCommentRepository = resourceCommentRepository;
    }

    public UserSummary register(RegisterRequest request) {
        if (request == null || !StringUtils.hasText(request.userName()) || !StringUtils.hasText(request.password())
                || !StringUtils.hasText(request.email())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "userName, password, email are required");
        }

        UserRole role = request.role() == null ? UserRole.REGISTERED_VIEWER : request.role();
        if (role == UserRole.ADMIN_REVIEWER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Admin registration is not allowed via public API");
        }

        String userName = request.userName().trim();
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByUserName(userName)) {
            throw new ApiException(HttpStatus.CONFLICT, "User name already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }

        User user = new User();
        user.setUserName(userName);
        user.setPassword(request.password().trim());
        user.setEmail(email);
        user.setRole(role);
        user.setContributorApproved(role != UserRole.CONTRIBUTOR);
        userRepository.save(user);
        return toUserSummary(user);
    }

    @Transactional(readOnly = true)
    public UserSummary login(LoginRequest request) {
        if (request == null || !StringUtils.hasText(request.userName()) || !StringUtils.hasText(request.password())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "userName and password are required");
        }

        User user = userRepository.findByUserName(request.userName().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid userName or password"));
        if (!user.isEnabled()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "User is disabled");
        }
        if (!user.getPassword().equals(request.password())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid userName or password");
        }
        return toUserSummary(user);
    }

    @Transactional(readOnly = true)
    public UserSummary getProfile(Long userId) {
        return toUserSummary(getUserOrThrow(userId));
    }

    public UserSummary updateProfile(Long userId, UpdateProfileRequest request) {
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        User user = getUserOrThrow(userId);

        if (StringUtils.hasText(request.userName())) {
            String newUserName = request.userName().trim();
            if (!newUserName.equals(user.getUserName()) && userRepository.existsByUserName(newUserName)) {
                throw new ApiException(HttpStatus.CONFLICT, "User name already exists");
            }
            user.setUserName(newUserName);
        }

        if (StringUtils.hasText(request.email())) {
            String newEmail = request.email().trim().toLowerCase();
            if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
            }
            user.setEmail(newEmail);
        }

        if (StringUtils.hasText(request.password())) {
            user.setPassword(request.password().trim());
        }

        return toUserSummary(userRepository.save(user));
    }

    public UserSummary approveContributor(Long actorId, Long contributorId) {
        User actor = getUserOrThrow(actorId);
        requireRole(actor, UserRole.ADMIN_REVIEWER);

        User contributor = getUserOrThrow(contributorId);
        if (contributor.getRole() != UserRole.CONTRIBUTOR) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Target user is not a contributor");
        }

        contributor.setContributorApproved(true);
        userRepository.save(contributor);
        return toUserSummary(contributor);
    }

    public Category createCategory(Long actorId, CreateCategoryRequest request) {
        User actor = getUserOrThrow(actorId);
        requireRole(actor, UserRole.ADMIN_REVIEWER);
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
        User actor = getUserOrThrow(actorId);
        requireRole(actor, UserRole.ADMIN_REVIEWER);
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
        User actor = getUserOrThrow(actorId);
        requireRole(actor, UserRole.ADMIN_REVIEWER);

        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.CONTRIBUTOR)
                .filter(user -> !user.isContributorApproved())
                .map(this::toUserSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ResourceSummary> listPendingResources(Long actorId) {
        User actor = getUserOrThrow(actorId);
        requireRole(actor, UserRole.ADMIN_REVIEWER);

        return resourceEntryRepository.findAll(
                (root, query, builder) -> builder.equal(root.get("status"), ResourceStatus.PENDING_REVIEW),
                Sort.by(Sort.Direction.DESC, "updatedAt"))
                .stream()
                .map(this::toResourceSummary)
                .toList();
    }

    public ResourceDetail createDraft(Long actorId, ResourceUpsertRequest request) {
        User actor = getUserOrThrow(actorId);
        requireRole(actor, UserRole.CONTRIBUTOR);

        ResourceEntry entry = new ResourceEntry();
        entry.setContributor(actor);
        entry.setStatus(ResourceStatus.DRAFT);
        fillResourceFields(entry, request);

        return toResourceDetail(resourceEntryRepository.save(entry));
    }

    public ResourceDetail updateDraft(Long actorId, Long resourceId, ResourceUpsertRequest request) {
        User actor = getUserOrThrow(actorId);
        ResourceEntry entry = getResourceOrThrow(resourceId);

        requireOwner(actor, entry);
        if (entry.getStatus() != ResourceStatus.DRAFT && entry.getStatus() != ResourceStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only draft/rejected resources can be edited");
        }

        fillResourceFields(entry, request);
        return toResourceDetail(resourceEntryRepository.save(entry));
    }

    public ResourceDetail submitForReview(Long actorId, Long resourceId) {
        User actor = getUserOrThrow(actorId);
        ResourceEntry entry = getResourceOrThrow(resourceId);

        requireOwner(actor, entry);
        requireRole(actor, UserRole.CONTRIBUTOR);
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
        return toResourceDetail(resourceEntryRepository.save(entry));
    }

    public ResourceDetail resubmit(Long actorId, Long resourceId) {
        User actor = getUserOrThrow(actorId);
        ResourceEntry entry = getResourceOrThrow(resourceId);
        requireOwner(actor, entry);
        requireRole(actor, UserRole.CONTRIBUTOR);
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
        return toResourceDetail(resourceEntryRepository.save(entry));
    }

    public ResourceDetail review(Long actorId, Long resourceId, ReviewRequest request) {
        User actor = getUserOrThrow(actorId);
        requireRole(actor, UserRole.ADMIN_REVIEWER);
        ResourceEntry entry = getResourceOrThrow(resourceId);

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

        return toResourceDetail(resourceEntryRepository.save(entry));
    }

    public ResourceDetail archive(Long actorId, Long resourceId) {
        User actor = getUserOrThrow(actorId);
        requireRole(actor, UserRole.ADMIN_REVIEWER);
        ResourceEntry entry = getResourceOrThrow(resourceId);

        entry.setStatus(ResourceStatus.ARCHIVED);
        entry.setArchivedAt(LocalDateTime.now());
        return toResourceDetail(resourceEntryRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public List<ResourceSummary> listMyResources(Long actorId) {
        User actor = getUserOrThrow(actorId);
        requireRole(actor, UserRole.CONTRIBUTOR);

        return resourceEntryRepository.findByContributorUserIdOrderByUpdatedAtDesc(actor.getUserId()).stream()
                .map(this::toResourceSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ResourceSummary> searchApproved(String keyword, Long categoryId, String place, String tag) {
        Specification<ResourceEntry> specification = (root, query, builder) -> {
            query.distinct(true);
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("status"), ResourceStatus.APPROVED));

            if (StringUtils.hasText(keyword)) {
                String normalized = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("title")), normalized),
                        builder.like(builder.lower(root.get("topic")), normalized),
                        builder.like(builder.lower(root.get("placeName")), normalized)));
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

        return resourceEntryRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
                .map(this::toResourceSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public ResourceDetail getApprovedDetail(Long resourceId) {
        ResourceEntry entry = getResourceOrThrow(resourceId);
        if (entry.getStatus() != ResourceStatus.APPROVED) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Resource not found");
        }
        return toResourceDetail(entry);
    }

    public CommentView addComment(Long actorId, Long resourceId, CommentRequest request) {
        User actor = getUserOrThrow(actorId);
        if (!actor.isEnabled()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "User is disabled");
        }

        ResourceEntry entry = getResourceOrThrow(resourceId);
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
        return toCommentView(resourceCommentRepository.save(comment));
    }

    @Transactional(readOnly = true)
    public List<CommentView> listComments(Long resourceId) {
        ResourceEntry entry = getResourceOrThrow(resourceId);
        if (entry.getStatus() != ResourceStatus.APPROVED) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Resource not found");
        }
        return resourceCommentRepository.findByResourceResourceIdOrderByCreatedAtAsc(resourceId).stream()
                .map(this::toCommentView)
                .toList();
    }

    private User getUserOrThrow(Long userId) {
        if (userId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "actorId/userId is required");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found: " + userId));
    }

    private ResourceEntry getResourceOrThrow(Long resourceId) {
        return resourceEntryRepository.findById(resourceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Resource not found: " + resourceId));
    }

    private Category getCategoryOrThrow(Long categoryId) {
        if (categoryId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "categoryId is required");
        }
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Category not found: " + categoryId));
    }

    private void requireRole(User user, UserRole role) {
        if (user.getRole() != role) {
            throw new ApiException(HttpStatus.FORBIDDEN, "User role not allowed for this action");
        }
    }

    private void requireOwner(User actor, ResourceEntry entry) {
        if (!entry.getContributor().getUserId().equals(actor.getUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only owner contributor can modify this resource");
        }
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
        entry.setCategory(getCategoryOrThrow(request.categoryId()));
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

    private UserSummary toUserSummary(User user) {
        return new UserSummary(
                user.getUserId(),
                user.getUserName(),
                user.getEmail(),
                user.getRole(),
                user.isContributorApproved());
    }

    private ResourceSummary toResourceSummary(ResourceEntry entry) {
        return new ResourceSummary(
                entry.getResourceId(),
                entry.getTitle(),
                entry.getTopic(),
                entry.getPlaceName(),
                entry.getStatus(),
                entry.getContributor().getUserId(),
                entry.getContributor().getUserName(),
                entry.getCategory().getCategoryId(),
                entry.getCategory().getName(),
                entry.getTags().stream().map(Tag::getName).collect(Collectors.toCollection(HashSet::new)),
                entry.getUpdatedAt());
    }

    private ResourceDetail toResourceDetail(ResourceEntry entry) {
        return new ResourceDetail(
                entry.getResourceId(),
                entry.getTitle(),
                entry.getTopic(),
                entry.getPlaceName(),
                entry.getDescription(),
                entry.getFileUrl(),
                entry.getExternalLink(),
                entry.getCopyrightDeclaration(),
                entry.getStatus(),
                entry.getReviewerFeedback(),
                entry.getContributor().getUserId(),
                entry.getContributor().getUserName(),
                entry.getCategory().getCategoryId(),
                entry.getCategory().getName(),
                entry.getTags().stream().map(Tag::getName).collect(Collectors.toCollection(HashSet::new)),
                entry.getCreatedAt(),
                entry.getUpdatedAt(),
                entry.getReviewedAt(),
                entry.getPublishedAt(),
                entry.getArchivedAt());
    }

    private CommentView toCommentView(ResourceComment comment) {
        return new CommentView(
                comment.getCommentId(),
                comment.getAuthor().getUserId(),
                comment.getAuthor().getUserName(),
                comment.getContent(),
                comment.getCreatedAt());
    }
}
