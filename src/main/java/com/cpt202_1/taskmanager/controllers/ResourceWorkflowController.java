package com.cpt202_1.taskmanager.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cpt202_1.taskmanager.dto.request.ResourceUpsertRequest;
import com.cpt202_1.taskmanager.dto.request.ReviewRequest;
import com.cpt202_1.taskmanager.dto.response.ResourceDetail;
import com.cpt202_1.taskmanager.dto.response.ResourceSummary;
import com.cpt202_1.taskmanager.service.PlatformService;

@RestController
@RequestMapping("/api/resources")
public class ResourceWorkflowController {
    private final PlatformService platformService;

    public ResourceWorkflowController(PlatformService platformService) {
        this.platformService = platformService;
    }

    @PostMapping
    public ResourceDetail createDraft(@RequestParam Long actorId, @RequestBody ResourceUpsertRequest request) {
        return platformService.createDraft(actorId, request);
    }

    @PutMapping("/{resourceId}")
    public ResourceDetail updateDraft(
            @RequestParam Long actorId,
            @PathVariable Long resourceId,
            @RequestBody ResourceUpsertRequest request) {
        return platformService.updateDraft(actorId, resourceId, request);
    }

    @PostMapping("/{resourceId}/submit")
    public ResourceDetail submit(@RequestParam Long actorId, @PathVariable Long resourceId) {
        return platformService.submitForReview(actorId, resourceId);
    }

    @PostMapping("/{resourceId}/resubmit")
    public ResourceDetail resubmit(@RequestParam Long actorId, @PathVariable Long resourceId) {
        return platformService.resubmit(actorId, resourceId);
    }

    @PostMapping("/{resourceId}/review")
    public ResourceDetail review(
            @RequestParam Long actorId,
            @PathVariable Long resourceId,
            @RequestBody ReviewRequest request) {
        return platformService.review(actorId, resourceId, request);
    }

    @GetMapping("/mine")
    public List<ResourceSummary> mine(@RequestParam Long actorId) {
        return platformService.listMyResources(actorId);
    }
}
