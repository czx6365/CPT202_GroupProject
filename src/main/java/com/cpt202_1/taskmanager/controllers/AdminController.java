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

import com.cpt202_1.taskmanager.dto.request.CreateCategoryRequest;
import com.cpt202_1.taskmanager.dto.request.CreateTagRequest;
import com.cpt202_1.taskmanager.dto.response.ResourceDetail;
import com.cpt202_1.taskmanager.dto.response.ResourceSummary;
import com.cpt202_1.taskmanager.dto.response.UserSummary;
import com.cpt202_1.taskmanager.pojo.Category;
import com.cpt202_1.taskmanager.pojo.Tag;
import com.cpt202_1.taskmanager.service.PlatformService;

@RestController  //接收 HTTP 请求  返回 JSON 数据
@RequestMapping("/api/admin")  //这个 Controller 的所有接口都以这个路径开头
public class AdminController {
    private final PlatformService platformService;
    //调用 Service 层 platformService
    public AdminController(PlatformService platformService) {
        this.platformService = platformService;
    }
    //审批 Contributor
    @PutMapping("/contributors/{userId}/approve")
    public UserSummary approveContributor(@RequestParam Long actorId, @PathVariable Long userId) {
        return platformService.approveContributor(actorId, userId);
    }
    //查看待审批用户
    @GetMapping("/contributors/pending")
    public List<UserSummary> listPendingContributors(@RequestParam Long actorId) {
        return platformService.listPendingContributors(actorId);
    }
    
    @PostMapping("/categories")
    public Category createCategory(@RequestParam Long actorId, @RequestBody CreateCategoryRequest request) {
        return platformService.createCategory(actorId, request);
    }

    @GetMapping("/categories")
    public List<Category> listCategories() {
        return platformService.listCategories();
    }

    @PostMapping("/tags")
    public Tag createTag(@RequestParam Long actorId, @RequestBody CreateTagRequest request) {
        return platformService.createTag(actorId, request);
    }

    @GetMapping("/tags")
    public List<Tag> listTags() {
        return platformService.listTags();
    }

    @PutMapping("/resources/{resourceId}/archive")
    public ResourceDetail archive(@RequestParam Long actorId, @PathVariable Long resourceId) {
        return platformService.archive(actorId, resourceId);
    }

    @GetMapping("/resources/pending")
    public List<ResourceSummary> listPendingResources(@RequestParam Long actorId) {
        return platformService.listPendingResources(actorId);
    }
}
