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
import com.cpt202_1.taskmanager.dto.response.PageResult;
import com.cpt202_1.taskmanager.dto.response.ResourceDetail;
import com.cpt202_1.taskmanager.dto.response.ResourceSummary;
import com.cpt202_1.taskmanager.dto.response.UserSummary;
import com.cpt202_1.taskmanager.pojo.Category;
import com.cpt202_1.taskmanager.pojo.Tag;
import com.cpt202_1.taskmanager.pojo.enums.ResourceStatus;
import com.cpt202_1.taskmanager.security.AuthenticatedUser;
import com.cpt202_1.taskmanager.service.AdminService;
import com.cpt202_1.taskmanager.service.ResourceCatalogService;

@RestController//能接收 HTTP 请求
// 返回的数据会直接变成 JSON
// 比如方法返回：
// return adminService.listTags();
// Spring 会自动把 List<Tag> 转成 JSON 返回给前端
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;
    private final ResourceCatalogService resourceCatalogService;

    public AdminController(AdminService adminService, ResourceCatalogService resourceCatalogService) {
        this.adminService = adminService;
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

    @GetMapping("/categories")
    public List<Category> listCategories() {
        return adminService.listCategories();
    }

    @PostMapping("/tags")
    public Tag createTag(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestBody CreateTagRequest request) {
        return adminService.createTag(currentUser.getUserId(), request);
    }

    @GetMapping("/tags")
    public List<Tag> listTags() {
        return adminService.listTags();
    }

    @PutMapping("/resources/{resourceId}/archive")
    public ResourceDetail archive(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long resourceId) {
        return adminService.archive(currentUser.getUserId(), resourceId);
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
}
