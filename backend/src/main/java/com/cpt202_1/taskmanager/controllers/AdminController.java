package com.cpt202_1.taskmanager.controllers;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cpt202_1.taskmanager.dto.request.ContributorDecisionRequest;
import com.cpt202_1.taskmanager.dto.request.CreateCategoryRequest;
import com.cpt202_1.taskmanager.dto.request.CreateTagRequest;
import com.cpt202_1.taskmanager.dto.request.AnnouncementStatusRequest;
import com.cpt202_1.taskmanager.dto.request.AnnouncementUpsertRequest;
import com.cpt202_1.taskmanager.dto.response.AuditLogView;
import com.cpt202_1.taskmanager.dto.response.AnnouncementView;
import com.cpt202_1.taskmanager.dto.response.CategoryView;
import com.cpt202_1.taskmanager.dto.response.PageResult;
import com.cpt202_1.taskmanager.dto.response.ResourceDetail;
import com.cpt202_1.taskmanager.dto.response.ResourceSummary;
import com.cpt202_1.taskmanager.dto.response.TagView;
import com.cpt202_1.taskmanager.dto.response.UserSummary;
import com.cpt202_1.taskmanager.pojo.Category;
import com.cpt202_1.taskmanager.pojo.enums.AnnouncementStatus;
import com.cpt202_1.taskmanager.pojo.enums.ResourceStatus;
import com.cpt202_1.taskmanager.security.AuthenticatedUser;
import com.cpt202_1.taskmanager.service.AdminService;
import com.cpt202_1.taskmanager.service.AuditLogService;
import com.cpt202_1.taskmanager.service.AnnouncementService;
import com.cpt202_1.taskmanager.service.ResourceCatalogService;

@RestController//能接收 HTTP 请求
// 返回的数据会直接变成 JSON
// 比如方法返回：
// return adminService.listTags();
// Spring 会自动把 List<Tag> 转成 JSON 返回给前端
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;
    private final AuditLogService auditLogService;
    private final AnnouncementService announcementService;
    private final ResourceCatalogService resourceCatalogService;

    public AdminController(
            AdminService adminService,
            AuditLogService auditLogService,
            AnnouncementService announcementService,
            ResourceCatalogService resourceCatalogService) {
        this.adminService = adminService;
        this.auditLogService = auditLogService;
        this.announcementService = announcementService;
        this.resourceCatalogService = resourceCatalogService;
    }
    // 1. approve contributor
    // 2. list pending contributors
    // 3. create category
    // 4. list categories
    // 5. create tag
    // 6. list tags
    // 7. archive resource
    // 8. list pending resources
    @PutMapping("/contributors/{userId}/approve")
    public UserSummary approveContributor(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long userId) {
        return adminService.approveContributor(currentUser.getUserId(), userId);
    }

    @PutMapping("/contributors/{userId}/reject")
    public UserSummary rejectContributor(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long userId,
            @RequestBody ContributorDecisionRequest request) {
        return adminService.rejectContributor(currentUser.getUserId(), userId, request);
    }

    @GetMapping("/contributors/pending")
    public List<UserSummary> listPendingContributors(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        return adminService.listPendingContributors(currentUser.getUserId());
    }

    @PostMapping("/categories")
    public Category createCategory(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestBody CreateCategoryRequest request) {
        return adminService.createCategory(currentUser.getUserId(), request);
    }

    @PutMapping("/categories/{categoryId}")
    public Category updateCategory(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long categoryId,
            @RequestBody CreateCategoryRequest request) {
        return adminService.updateCategory(currentUser.getUserId(), categoryId, request);
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/categories/{categoryId}")
    public void deleteCategory(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long categoryId) {
        adminService.deleteCategory(currentUser.getUserId(), categoryId);
    }

    @GetMapping("/categories")
    public List<CategoryView> listCategories() {
        return adminService.listCategories();
    }

    @PostMapping("/tags")
    public TagView createTag(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestBody CreateTagRequest request) {
        return adminService.createTag(currentUser.getUserId(), request);
    }

    @PutMapping("/tags/{tagId}")
    public TagView updateTag(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long tagId,
            @RequestBody CreateTagRequest request) {
        return adminService.updateTag(currentUser.getUserId(), tagId, request);
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/tags/{tagId}")
    public void deleteTag(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long tagId) {
        adminService.deleteTag(currentUser.getUserId(), tagId);
    }

    @GetMapping("/tags")
    public List<TagView> listTags() {
        return adminService.listTags();
    }

    @PutMapping("/resources/{resourceId}/archive")
    public ResourceDetail archive(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long resourceId) {
        return adminService.archive(currentUser.getUserId(), resourceId);
    }

    @PutMapping("/resources/{resourceId}/restore")
    public ResourceDetail restore(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long resourceId) {
        return adminService.restore(currentUser.getUserId(), resourceId);
    }

    @GetMapping("/resources/pending")
    public PageResult<ResourceSummary> listPendingResources(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String place,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedTime") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return resourceCatalogService.listPendingResources(
                currentUser.getUserId(),
                keyword,
                categoryId,
                place,
                tag,
                status,
                page,
                size,
                sortBy,
                sortDir);
    }

    @GetMapping("/resources/published")
    public PageResult<ResourceSummary> listPublishedResources(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String place,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedTime") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return resourceCatalogService.listResourcesByStatus(
                currentUser.getUserId(),
                keyword,
                categoryId,
                place,
                tag,
                ResourceStatus.APPROVED,
                page,
                size,
                sortBy,
                sortDir);
    }

    @GetMapping("/resources/archived")
    public PageResult<ResourceSummary> listArchivedResources(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String place,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedTime") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return resourceCatalogService.listResourcesByStatus(
                currentUser.getUserId(),
                keyword,
                categoryId,
                place,
                tag,
                ResourceStatus.ARCHIVED,
                page,
                size,
                sortBy,
                sortDir);
    }

    @GetMapping("/audit-logs")
    public List<AuditLogView> listAuditLogs(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String status) {
        return auditLogService.listAuditLogs(currentUser.getUserId(), keyword, module, status);
    }

    @GetMapping("/announcements")
    public List<AnnouncementView> listAnnouncements(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String audience,
            @RequestParam(required = false) AnnouncementStatus status) {
        return announcementService.listAnnouncements(currentUser.getUserId(), keyword, audience, status);
    }

    @PostMapping("/announcements")
    public AnnouncementView createAnnouncement(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestBody AnnouncementUpsertRequest request) {
        return announcementService.createAnnouncement(currentUser.getUserId(), request);
    }

    @PutMapping("/announcements/{announcementId}")
    public AnnouncementView updateAnnouncement(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long announcementId,
            @RequestBody AnnouncementUpsertRequest request) {
        return announcementService.updateAnnouncement(currentUser.getUserId(), announcementId, request);
    }

    @PutMapping("/announcements/{announcementId}/status")
    public AnnouncementView updateAnnouncementStatus(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long announcementId,
            @RequestBody AnnouncementStatusRequest request) {
        return announcementService.updateAnnouncementStatus(currentUser.getUserId(), announcementId, request);
    }
}
