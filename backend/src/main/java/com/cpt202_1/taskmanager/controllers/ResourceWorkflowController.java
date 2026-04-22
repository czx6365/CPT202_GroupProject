package com.cpt202_1.taskmanager.controllers;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cpt202_1.taskmanager.dto.request.ResourceUpsertRequest;
import com.cpt202_1.taskmanager.dto.request.ReviewRequest;
import com.cpt202_1.taskmanager.dto.response.ResourceDetail;
import com.cpt202_1.taskmanager.dto.response.ResourceSummary;
import com.cpt202_1.taskmanager.security.AuthenticatedUser;
import com.cpt202_1.taskmanager.service.ResourceWorkflowService;

@RestController
@RequestMapping("/api/resources")
public class ResourceWorkflowController {
    private final ResourceWorkflowService resourceWorkflowService;

    public ResourceWorkflowController(ResourceWorkflowService resourceWorkflowService) {
        this.resourceWorkflowService = resourceWorkflowService;
    }

    // 1. create resource draft
    // 2. update resource draft
    // 3. submit resource for review
    // 4. resubmit resource for review
    // 5. review resource
    // 6. list my resources
    @PostMapping
    public ResourceDetail createDraft(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestBody ResourceUpsertRequest request) {
        return resourceWorkflowService.createDraft(currentUser.getUserId(), request);
    }

    @PutMapping("/{resourceId}")
    public ResourceDetail updateDraft(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long resourceId,
            @RequestBody ResourceUpsertRequest request) {
        return resourceWorkflowService.updateDraft(currentUser.getUserId(), resourceId, request);
    }

    @GetMapping("/{resourceId}")
    public ResourceDetail detail(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long resourceId) {
        return resourceWorkflowService.getResourceDetail(currentUser.getUserId(), resourceId);
    }

    @PostMapping("/{resourceId}/submit")
    public ResourceDetail submit(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long resourceId) {
        return resourceWorkflowService.submitForReview(currentUser.getUserId(), resourceId);
    }

    @PostMapping("/{resourceId}/resubmit")
    public ResourceDetail resubmit(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long resourceId) {
        return resourceWorkflowService.resubmit(currentUser.getUserId(), resourceId);
    }

    @PostMapping("/{resourceId}/review")
    public ResourceDetail review(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long resourceId,
            @RequestBody ReviewRequest request) {
        return resourceWorkflowService.review(currentUser.getUserId(), resourceId, request);
    }

    @GetMapping("/mine")
    public List<ResourceSummary> mine(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        return resourceWorkflowService.listMyResources(currentUser.getUserId());
    }
}
