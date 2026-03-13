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

/**
 * 平台核心业务服务。
 *
 * <p>职责范围：
 * <p>1. 用户注册/登录/资料管理
 * <p>2. 管理员对投稿者、分类、标签的管理
 * <p>3. 资源从草稿到审核、发布、归档的完整状态流转
 * <p>4. 公开检索与评论
 *
 * <p>说明：
 * <p>- Controller 层只做参数接收，本类负责业务规则和状态机约束
 * <p>- 统一通过 {@link ApiException} 抛出业务异常，由全局异常处理器转换成 HTTP 响应
 */
@Service
@Transactional // 默认事务：同一业务方法中，多次数据库写入要么全部成功，要么全部回滚
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

    // ====================== 用户相关 ======================

    /**
     * 用户注册。
     *
     * <p>流程：
     * <p>1. 校验必填参数
     * <p>2. 计算角色默认值（未传角色时为 REGISTERED_VIEWER）
     * <p>3. 禁止通过公开接口注册管理员
     * <p>4. 校验用户名/邮箱唯一
     * <p>5. 创建用户并持久化
     *
     * <p>关键调用：
     * <p>- {@code userRepository.existsByUserName / existsByEmail}: 唯一性校验
     * <p>- {@code toUserSummary}: 实体转响应 DTO（首次出现）
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
        user.setPassword(request.password().trim());
        user.setEmail(email);
        user.setRole(role);
        // CONTRIBUTOR 需要管理员审批，其它角色默认通过
        user.setContributorApproved(role != UserRole.CONTRIBUTOR);
        userRepository.save(user);

        // 首次调用 DTO 映射函数：把实体转换为对外返回对象
        return toUserSummary(user);
    }

    /**
     * 用户登录（初版：明文密码比对，无 JWT）。
     *
     * <p>流程：
     * <p>1. 校验请求参数
     * <p>2. 按用户名查找用户
     * <p>3. 校验账号是否启用
     * <p>4. 校验密码
     */
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

    /**
     * 获取用户资料。
     *
     * <p>关键调用（首次出现）：
     * <p>- {@code getUserOrThrow}: 通用“按 ID 查用户并兜底异常”的辅助函数
     */
    @Transactional(readOnly = true)
    public UserSummary getProfile(Long userId) {
        return toUserSummary(getUserOrThrow(userId));
    }

    /**
     * 更新用户资料（部分更新）。
     *
     * <p>可更新字段：userName / email / password
     * <p>约束：若更新 userName 或 email，仍需保证唯一性
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
            user.setPassword(request.password().trim());
        }

        return toUserSummary(userRepository.save(user));
    }

    /**
     * 管理员审批投稿者资格。
     *
     * <p>关键调用（首次出现）：
     * <p>- {@code requireRole}: 通用角色校验辅助函数
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

    // ==================== 分类 / 标签管理 ====================

    /**
     * 管理员创建分类。
     *
     * <p>调用链：
     * <p>Controller -> createCategory -> categoryRepository.save
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
     * 查询分类列表（按名称升序）。
     */
    @Transactional(readOnly = true)
    public List<Category> listCategories() {
        return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
    }

    /**
     * 管理员创建标签。
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
     * 查询标签列表（按名称升序）。
     */
    @Transactional(readOnly = true)
    public List<Tag> listTags() {
        return tagRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
    }

    /**
     * 管理员查看待审批投稿者列表。
     *
     * <p>过滤规则：角色为 CONTRIBUTOR 且 contributorApproved = false
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

    // ===================== 资源工作流 =====================

    /**
     * 管理员查看待审核资源。
     *
     * <p>过滤规则：status = PENDING_REVIEW，按 updatedAt 倒序
     */
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

    /**
     * 投稿者创建草稿资源。
     *
     * <p>关键调用（首次出现）：
     * <p>- {@code fillResourceFields}: 公共字段赋值与校验逻辑（新建/编辑复用）
     */
    public ResourceDetail createDraft(Long actorId, ResourceUpsertRequest request) {
        User actor = getUserOrThrow(actorId);
        requireRole(actor, UserRole.CONTRIBUTOR);

        ResourceEntry entry = new ResourceEntry();
        entry.setContributor(actor);
        entry.setStatus(ResourceStatus.DRAFT);
        fillResourceFields(entry, request);

        return toResourceDetail(resourceEntryRepository.save(entry));
    }

    /**
     * 投稿者编辑草稿或被驳回资源。
     *
     * <p>关键调用（首次出现）：
     * <p>- {@code getResourceOrThrow}: 按资源 ID 获取资源并兜底异常
     * <p>- {@code requireOwner}: 校验当前操作人是否为资源所有者
     */
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

    /**
     * 投稿者提交审核。
     *
     * <p>状态流转：DRAFT / REJECTED -> PENDING_REVIEW
     * <p>额外动作：清空上一次审核痕迹（reviewer/reviewedAt/feedback）
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

        entry.setStatus(ResourceStatus.PENDING_REVIEW);
        entry.setReviewer(null);
        entry.setReviewedAt(null);
        entry.setReviewerFeedback(null);
        return toResourceDetail(resourceEntryRepository.save(entry));
    }

    /**
     * 投稿者重新提交审核。
     *
     * <p>与 submitForReview 的区别：
     * <p>- 这里只允许 REJECTED -> PENDING_REVIEW
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

        entry.setStatus(ResourceStatus.PENDING_REVIEW);
        entry.setReviewer(null);
        entry.setReviewedAt(null);
        entry.setReviewerFeedback(null);
        return toResourceDetail(resourceEntryRepository.save(entry));
    }

    /**
     * 管理员审核资源。
     *
     * <p>前置条件：资源必须处于 PENDING_REVIEW
     * <p>状态流转：
     * <p>- APPROVE: PENDING_REVIEW -> APPROVED，并设置发布时间
     * <p>- REJECT: PENDING_REVIEW -> REJECTED
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
     * 管理员归档资源。
     *
     * <p>说明：归档后资源不再出现在公开检索中（公开检索仅查 APPROVED）
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
     * 投稿者查看自己的资源列表（按更新时间倒序）。
     */
    @Transactional(readOnly = true)
    public List<ResourceSummary> listMyResources(Long actorId) {
        User actor = getUserOrThrow(actorId);
        requireRole(actor, UserRole.CONTRIBUTOR);

        return resourceEntryRepository.findByContributorUserIdOrderByUpdatedAtDesc(actor.getUserId()).stream()
                .map(this::toResourceSummary)
                .toList();
    }

    // ==================== 公开浏览与评论 ====================

    /**
     * 公开检索（仅 APPROVED）。
     *
     * <p>支持过滤条件：
     * <p>- keyword：匹配 title/topic/placeName（模糊）
     * <p>- categoryId：分类精确匹配
     * <p>- place：地点模糊匹配
     * <p>- tag：标签名精确匹配（忽略大小写）
     *
     * <p>关键点：
     * <p>- 使用 JPA Specification 动态拼接查询条件
     * <p>- query.distinct(true) 防止标签 join 导致重复数据
     */
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

    /**
     * 获取公开资源详情（仅 APPROVED）。
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
     *
     * <p>约束：
     * <p>- 操作用户必须存在且 enabled
     * <p>- 目标资源必须是 APPROVED
     * <p>- 评论内容不能为空
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
     *
     * <p>安全策略：非 APPROVED 资源直接返回“Resource not found”，避免泄露资源状态信息
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

    // ====================== 私有辅助方法 ======================

    /**
     * 按 userId 获取用户，不存在则抛出业务异常。
     */
    private User getUserOrThrow(Long userId) {
        if (userId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "actorId/userId is required");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found: " + userId));
    }

    /**
     * 按 resourceId 获取资源，不存在则抛出业务异常。
     */
    private ResourceEntry getResourceOrThrow(Long resourceId) {
        return resourceEntryRepository.findById(resourceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Resource not found: " + resourceId));
    }

    /**
     * 按 categoryId 获取分类，不存在则抛出业务异常。
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
     * 通用所有者校验：只有资源作者本人可修改该资源。
     */
    private void requireOwner(User actor, ResourceEntry entry) {
        if (!entry.getContributor().getUserId().equals(actor.getUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only owner contributor can modify this resource");
        }
    }

    /**
     * 资源字段写入（新建/编辑复用）。
     *
     * <p>关键调用：
     * <p>- {@code getCategoryOrThrow}: 分类有效性校验
     * <p>- {@code resolveTags}: 标签名集合 -> Tag 实体集合（首次解析标签调用链）
     */
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

    /**
     * 将标签名集合解析为 Tag 实体集合。
     *
     * <p>策略：
     * <p>- 忽略 null/空白标签名
     * <p>- 每个标签必须已存在，否则抛异常（不在这里自动创建）
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
     * User 实体 -> UserSummary DTO。
     */
    private UserSummary toUserSummary(User user) {
        return new UserSummary(
                user.getUserId(),
                user.getUserName(),
                user.getEmail(),
                user.getRole(),
                user.isContributorApproved());
    }

    /**
     * ResourceEntry 实体 -> ResourceSummary DTO。
     */
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

    /**
     * ResourceEntry 实体 -> ResourceDetail DTO。
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
                entry.getCategory().getCategoryId(),
                entry.getCategory().getName(),
                entry.getTags().stream().map(Tag::getName).collect(Collectors.toCollection(HashSet::new)),
                entry.getCreatedAt(),
                entry.getUpdatedAt(),
                entry.getReviewedAt(),
                entry.getPublishedAt(),
                entry.getArchivedAt());
    }

    /**
     * ResourceComment 实体 -> CommentView DTO。
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
