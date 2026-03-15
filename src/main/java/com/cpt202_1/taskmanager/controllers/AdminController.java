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
import com.cpt202_1.taskmanager.service.PlatformService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final PlatformService platformService;

    public AdminController(PlatformService platformService) {
        this.platformService = platformService;
    }

    @PutMapping("/contributors/{userId}/approve")
    public UserSummary approveContributor(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long userId) {
        return platformService.approveContributor(currentUser.getUserId(), userId);
    }

    @GetMapping("/contributors/pending")
    public List<UserSummary> listPendingContributors(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        return platformService.listPendingContributors(currentUser.getUserId());
    }

    @PostMapping("/categories")
    public Category createCategory(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestBody CreateCategoryRequest request) {
        return platformService.createCategory(currentUser.getUserId(), request);
    }

    @GetMapping("/categories")
    public List<Category> listCategories() {
        return platformService.listCategories();
    }

    @PostMapping("/tags")
    public Tag createTag(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestBody CreateTagRequest request) {
        return platformService.createTag(currentUser.getUserId(), request);
    }

    @GetMapping("/tags")
    public List<Tag> listTags() {
        return platformService.listTags();
    }

    @PutMapping("/resources/{resourceId}/archive")
    public ResourceDetail archive(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long resourceId) {
        return platformService.archive(currentUser.getUserId(), resourceId);
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
        return platformService.listPendingResources(
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
