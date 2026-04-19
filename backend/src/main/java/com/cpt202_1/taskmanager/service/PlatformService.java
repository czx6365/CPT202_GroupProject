package com.cpt202_1.taskmanager.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
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
import com.cpt202_1.taskmanager.dto.response.PageResult;
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

/**
 * 平台核心业务服务层。
 * <p>职责：
 * 1) 用户注册、登录、资料维护
 * 2) 管理员分类/标签/投稿者审批管理
 * 3) 资源工作流状态流转（草稿、送审、审核、归档）
 * 4) 公开检索与评论
 */
@Service
@Transactional // 默认开启事务，保证同一业务方法内的数据一致性
public class PlatformService {
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final ResourceEntryRepository resourceEntryRepository;
    private final ResourceCommentRepository resourceCommentRepository;
    private final PasswordEncoder passwordEncoder;

    public PlatformService(
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            TagRepository tagRepository,
            ResourceEntryRepository resourceEntryRepository,
            ResourceCommentRepository resourceCommentRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.resourceEntryRepository = resourceEntryRepository;
        this.resourceCommentRepository = resourceCommentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * 用户注册。
     * <p>关键规则：禁止公开接口注册管理员；用户名和邮箱必须唯一；密码使用 BCrypt 存储。
     */
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
        user.setPassword(passwordEncoder.encode(request.password().trim()));
        user.setEmail(email);
        user.setRole(role);
        user.setContributorApproved(false);
        userRepository.save(user);

        return toUserSummary(user);
    }

    /**
     * 用户登录。
     * <p>流程：按用户名查找 -> 账号可用性校验 -> 密码匹配（兼容旧明文并自动升级）。
     */
    @Transactional
    public UserSummary login(LoginRequest request) {
        if (request == null || !StringUtils.hasText(request.userName()) || !StringUtils.hasText(request.password())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "userName and password are required");
        }

        User user = userRepository.findByUserName(request.userName().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid userName or password"));
        if (!user.isEnabled()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "User is disabled");
        }
        if (!passwordMatchesAndUpgradeIfNeeded(user, request.password())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid userName or password");
        }
        return toUserSummary(user);
    }

    /**
     * 查询个人资料。
     */
    @Transactional(readOnly = true)
    public UserSummary getProfile(Long userId) {
        return toUserSummary(getUserOrThrow(userId));
    }

    /**
     * 更新个人资料（部分更新）。
     * <p>支持字段：userName、email、password；更新 userName/email 时依然校验唯一性。
     */
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
            if (!StringUtils.hasText(request.currentPassword())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is required");
            }

            String currentPassword = request.currentPassword().trim();
            if (!passwordMatchesAndUpgradeIfNeeded(user, currentPassword)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
            }

            String newPassword = request.password().trim();
            if (newPassword.length() < 6) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "New password must contain at least 6 characters");
            }

            user.setPassword(passwordEncoder.encode(newPassword));
        }

        return toUserSummary(userRepository.save(user));
    }

    /**
     * 管理员审批投稿者资格。
     */
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

    /**
     * 用户提交 contributor 申请（包含申请文本）。
     */
    public UserSummary applyContributor(Long userId, String applicationText) {
        if (!StringUtils.hasText(applicationText)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Application content is required");
        }

        User user = getUserOrThrow(userId);
        if (!user.isEnabled()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "User is disabled");
        }
        if (user.getRole() == UserRole.ADMIN_REVIEWER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Admin account cannot apply as contributor");
        }
        if (user.getRole() == UserRole.CONTRIBUTOR && user.isContributorApproved()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You are already an approved contributor");
        }

        user.setRole(UserRole.CONTRIBUTOR);
        user.setContributorApproved(false);
        user.setContributorApplication(applicationText.trim());
        user.setContributorRequestedAt(LocalDateTime.now());
        return toUserSummary(userRepository.save(user));
    }

    /**
     * 管理员新增分类。
     */
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

    /**
     * 查询分类（按名称升序）。
     */
    @Transactional(readOnly = true)
    public List<Category> listCategories() {
        return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
    }

    /**
     * 管理员新增标签。
     */
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

    /**
     * 查询标签（按名称升序）。
     */
    @Transactional(readOnly = true)
    public List<Tag> listTags() {
        return tagRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
    }

    /**
     * 查询待审批投稿者列表（角色为 CONTRIBUTOR 且未被批准）。
     */
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

    /**
     * 管理端资源列表（默认待审核）。
     * <p>支持：关键词、分类、地点、标签、状态筛选 + 分页 + 排序。
     */
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
        User actor = getUserOrThrow(actorId);
        requireRole(actor, UserRole.ADMIN_REVIEWER);

        ResourceStatus targetStatus = status == null ? ResourceStatus.PENDING_REVIEW : status;
        Specification<ResourceEntry> specification = buildResourceSpecification(
                keyword, categoryId, place, tag, targetStatus);
        Pageable pageable = buildResourcePageRequest(page, size, sortBy, sortDir);
        Page<ResourceEntry> resultPage = resourceEntryRepository.findAll(specification, pageable);
        return PageResult.from(resultPage, this::toResourceSummary);
    }

    /**
     * 兼容旧接口的无分页版本（内部转为分页查询）。
     */
    @Transactional(readOnly = true)
    public List<ResourceSummary> listPendingResources(Long actorId) {
        return listPendingResources(
                actorId, null, null, null, null, ResourceStatus.PENDING_REVIEW, 0, 1000, "updatedTime", "desc")
                .content();
    }

    /**
     * 投稿者创建草稿资源，初始状态为 DRAFT。
     */
    public ResourceDetail createDraft(Long actorId, ResourceUpsertRequest request) {
        User actor = getUserOrThrow(actorId);
        requireRole(actor, UserRole.CONTRIBUTOR);

        ResourceEntry entry = new ResourceEntry();
        entry.setContributor(actor);
        entry.setStatus(ResourceStatus.DRAFT);
        fillDraftFields(entry, request);

        return toResourceDetail(resourceEntryRepository.save(entry));
    }

    /**
     * 投稿者更新草稿/驳回资源，仅所有者可操作。
     */
    public ResourceDetail updateDraft(Long actorId, Long resourceId, ResourceUpsertRequest request) {
        User actor = getUserOrThrow(actorId);
        ResourceEntry entry = getResourceOrThrow(resourceId);

        requireOwner(actor, entry);
        if (entry.getStatus() != ResourceStatus.DRAFT && entry.getStatus() != ResourceStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only draft/rejected resources can be edited");
        }

        fillDraftFields(entry, request);
        return toResourceDetail(resourceEntryRepository.save(entry));
    }

    /**
     * 投稿者提交审核。
     * <p>状态流转：DRAFT/REJECTED -> PENDING_REVIEW。
     */
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
        validateReadyForReview(entry);

        entry.setStatus(ResourceStatus.PENDING_REVIEW);
        entry.setReviewer(null);
        entry.setReviewedAt(null);
        entry.setReviewerFeedback(null);
        return toResourceDetail(resourceEntryRepository.save(entry));
    }

    /**
     * 投稿者重新提交审核，仅 REJECTED 可重提。
     */
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
        validateReadyForReview(entry);

        entry.setStatus(ResourceStatus.PENDING_REVIEW);
        entry.setReviewer(null);
        entry.setReviewedAt(null);
        entry.setReviewerFeedback(null);
        return toResourceDetail(resourceEntryRepository.save(entry));
    }

    /**
     * 管理员审核资源。
     * <p>APPROVE: PENDING_REVIEW -> APPROVED；REJECT: PENDING_REVIEW -> REJECTED。
     */
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

    /**
     * 管理员归档资源，归档后不会出现在公开检索结果中。
     */
    public ResourceDetail archive(Long actorId, Long resourceId) {
        User actor = getUserOrThrow(actorId);
        requireRole(actor, UserRole.ADMIN_REVIEWER);
        ResourceEntry entry = getResourceOrThrow(resourceId);

        entry.setStatus(ResourceStatus.ARCHIVED);
        entry.setArchivedAt(LocalDateTime.now());
        return toResourceDetail(resourceEntryRepository.save(entry));
    }

    /**
     * 投稿者查看自己资源（按更新时间倒序）。
     */
    @Transactional(readOnly = true)
    public List<ResourceSummary> listMyResources(Long actorId) {
        User actor = getUserOrThrow(actorId);
        requireRole(actor, UserRole.CONTRIBUTOR);

        return resourceEntryRepository.findByContributorUserIdOrderByUpdatedAtDesc(actor.getUserId()).stream()
                .map(this::toResourceSummary)
                .toList();
    }

    /**
     * 公开资源检索（仅 APPROVED）。
     * <p>支持：关键词、分类、地点、标签筛选 + 分页 + 排序。
     */
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
        return PageResult.from(resultPage, this::toResourceSummary);
    }

    /**
     * 兼容旧接口的无分页检索版本。
     */
    @Transactional(readOnly = true)
    public List<ResourceSummary> searchApproved(String keyword, Long categoryId, String place, String tag) {
        return searchApproved(keyword, categoryId, place, tag, 0, 1000, "updatedTime", "desc").content();
    }

    /**
     * 公开资源详情（仅 APPROVED 可见）。
     */
    @Transactional(readOnly = true)
    public ResourceDetail getApprovedDetail(Long resourceId) {
        ResourceEntry entry = getResourceOrThrow(resourceId);
        if (entry.getStatus() != ResourceStatus.APPROVED) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Resource not found");
        }
        return toResourceDetail(entry);
    }

    /**
     * 新增评论。
     * <p>仅启用用户可评论，且目标资源必须是 APPROVED。
     */
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

    /**
     * 查询评论列表（按创建时间升序）。
     */
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

    /**
     * 资源动态条件构造器。
     * <p>用于 public/admin 两个列表接口复用同一套筛选逻辑。
     */
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
                predicates.add(builder.like(builder.lower(root.get("title")), normalizedKeyword));
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

    /**
     * 构建分页与排序参数，统一处理 page/size/sortBy/sortDir 校验。
     */
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

    /**
     * 对外排序字段到实体字段的映射。
     */
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

    /**
     * 排序方向解析，仅允许 asc/desc。
     */
    private Sort.Direction resolveSortDirection(String sortDir) {
        if (!StringUtils.hasText(sortDir) || "desc".equalsIgnoreCase(sortDir)) {
            return Sort.Direction.DESC;
        }
        if ("asc".equalsIgnoreCase(sortDir)) {
            return Sort.Direction.ASC;
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "sortDir must be asc or desc");
    }

    /**
     * 按 userId 查询用户，不存在抛业务异常。
     */
    private User getUserOrThrow(Long userId) {
        if (userId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "actorId/userId is required");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found: " + userId));
    }

    /**
     * 按 resourceId 查询资源，不存在抛业务异常。
     */
    private ResourceEntry getResourceOrThrow(Long resourceId) {
        return resourceEntryRepository.findById(resourceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Resource not found: " + resourceId));
    }

    /**
     * 按 categoryId 查询分类，不存在抛业务异常。
     */
    private Category getCategoryOrThrow(Long categoryId) {
        if (categoryId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "categoryId is required");
        }
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Category not found: " + categoryId));
    }

    /**
     * 通用角色校验。
     */
    private void requireRole(User user, UserRole role) {
        if (user.getRole() != role) {
            throw new ApiException(HttpStatus.FORBIDDEN, "User role not allowed for this action");
        }
    }

    /**
     * 所有者校验：仅资源作者本人可修改。
     */
    private void requireOwner(User actor, ResourceEntry entry) {
        if (!entry.getContributor().getUserId().equals(actor.getUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only owner contributor can modify this resource");
        }
    }

    /**
     * 资源公共字段填充与必填校验（创建/编辑复用）。
     */
    private void fillDraftFields(ResourceEntry entry, ResourceUpsertRequest request) {
        if (request == null || !StringUtils.hasText(request.title())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "title is required");
        }

        entry.setTitle(request.title().trim());
        entry.setTopic(normalizeText(request.topic()));
        entry.setPlaceName(normalizeText(request.placeName()));
        entry.setDescription(normalizeText(request.description()));
        entry.setFileUrl(normalizeText(request.fileUrl()));
        entry.setExternalLink(normalizeText(request.externalLink()));
        entry.setCopyrightDeclaration(normalizeText(request.copyrightDeclaration()));
        entry.setCategory(request.categoryId() == null ? null : getCategoryOrThrow(request.categoryId()));
        entry.setTags(resolveTags(request.tags()));
    }

    private void validateReadyForReview(ResourceEntry entry) {
        if (!StringUtils.hasText(entry.getTitle())
                || !StringUtils.hasText(entry.getTopic())
                || !StringUtils.hasText(entry.getPlaceName())
                || !StringUtils.hasText(entry.getDescription())
                || !StringUtils.hasText(entry.getCopyrightDeclaration())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "title/topic/placeName/description/copyrightDeclaration are required before submission");
        }
        if (entry.getCategory() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "categoryId is required before submission");
        }
        if (!StringUtils.hasText(entry.getFileUrl()) && !StringUtils.hasText(entry.getExternalLink())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Provide at least one media reference before submission");
        }
    }

    private String normalizeText(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    /**
     * 标签名集合解析为 Tag 实体集合。
     * <p>策略：忽略空值；标签必须预先存在。
     */
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

    /**
     * 密码匹配并在必要时升级：兼容旧明文密码，登录成功后自动迁移为 BCrypt。
     */
    private boolean passwordMatchesAndUpgradeIfNeeded(User user, String rawPassword) {
        String encodedOrRaw = user.getPassword();

        if (isBcryptHash(encodedOrRaw)) {
            return passwordEncoder.matches(rawPassword, encodedOrRaw);
        }

        boolean matched = encodedOrRaw.equals(rawPassword);
        if (matched) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
        }
        return matched;
    }

    /**
     * 粗略判断字符串是否为 BCrypt 哈希。
     */
    private boolean isBcryptHash(String value) {
        return StringUtils.hasText(value)
                && (value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$"));
    }

    /**
     * User -> UserSummary DTO 映射。
     */
    private UserSummary toUserSummary(User user) {
        return new UserSummary(
                user.getUserId(),
                user.getUserName(),
                user.getEmail(),
                user.getRole(),
                user.isContributorApproved(),
                user.getContributorApplication(),
                user.getContributorRequestedAt(),
                user.getContributorRejectionReason());
    }

    /**
     * ResourceEntry -> ResourceSummary DTO 映射（列表视图）。
     */
    private ResourceSummary toResourceSummary(ResourceEntry entry) {
        return new ResourceSummary(
                entry.getResourceId(),
                entry.getTitle(),
                entry.getTopic(),
                entry.getDescription(),
                entry.getPlaceName(),
                entry.getStatus(),
                entry.getReviewerFeedback(),
                entry.getContributor().getUserId(),
                entry.getContributor().getUserName(),
                entry.getCategory() == null ? null : entry.getCategory().getCategoryId(),
                entry.getCategory() == null ? null : entry.getCategory().getName(),
                entry.getTags().stream().map(Tag::getName).collect(Collectors.toCollection(HashSet::new)),
                entry.getCreatedAt(),
                entry.getUpdatedAt());
    }

    /**
     * ResourceEntry -> ResourceDetail DTO 映射（详情视图）。
     */
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
                entry.getCategory() == null ? null : entry.getCategory().getCategoryId(),
                entry.getCategory() == null ? null : entry.getCategory().getName(),
                entry.getTags().stream().map(Tag::getName).collect(Collectors.toCollection(HashSet::new)),
                entry.getCreatedAt(),
                entry.getUpdatedAt(),
                entry.getReviewedAt(),
                entry.getPublishedAt(),
                entry.getArchivedAt());
    }

    /**
     * ResourceComment -> CommentView DTO 映射。
     */
    private CommentView toCommentView(ResourceComment comment) {
        return new CommentView(
                comment.getCommentId(),
                comment.getAuthor().getUserId(),
                comment.getAuthor().getUserName(),
                comment.getContent(),
                comment.getCreatedAt());
    }
}
