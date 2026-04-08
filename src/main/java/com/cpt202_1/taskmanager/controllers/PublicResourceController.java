package com.cpt202_1.taskmanager.controllers;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cpt202_1.taskmanager.dto.request.CommentRequest;
import com.cpt202_1.taskmanager.dto.response.CommentView;
import com.cpt202_1.taskmanager.dto.response.PageResult;
import com.cpt202_1.taskmanager.dto.response.ResourceDetail;
import com.cpt202_1.taskmanager.dto.response.ResourceSummary;
import com.cpt202_1.taskmanager.security.AuthenticatedUser;
import com.cpt202_1.taskmanager.service.ResourceCatalogService;

@RestController
@RequestMapping("/api/public/resources")
public class PublicResourceController {
    private final ResourceCatalogService resourceCatalogService;

    public PublicResourceController(ResourceCatalogService resourceCatalogService) {
        this.resourceCatalogService = resourceCatalogService;
    }

    // 1. search approved resources
    // 2. get approved resource detail
    // 3. list resource comments
    // 4. add resource comment
    @GetMapping
    public PageResult<ResourceSummary> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String place,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedTime") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return resourceCatalogService.searchApproved(keyword, categoryId, place, tag, page, size, sortBy, sortDir);
    }

    @GetMapping("/{resourceId}")
    public ResourceDetail detail(@PathVariable Long resourceId) {
        return resourceCatalogService.getApprovedDetail(resourceId);
    }

    @GetMapping("/{resourceId}/comments")
    public List<CommentView> comments(@PathVariable Long resourceId) {
        return resourceCatalogService.listComments(resourceId);
    }

    @PostMapping("/{resourceId}/comments")
    public CommentView comment(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long resourceId,
            @RequestBody CommentRequest request) {
        return resourceCatalogService.addComment(currentUser.getUserId(), resourceId, request);
    }
}
