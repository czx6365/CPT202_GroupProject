package com.cpt202_1.taskmanager.controllers;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cpt202_1.taskmanager.dto.response.AnnouncementView;
import com.cpt202_1.taskmanager.security.AuthenticatedUser;
import com.cpt202_1.taskmanager.service.AnnouncementService;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {
    private final AnnouncementService announcementService;

    public AnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @GetMapping
    public List<AnnouncementView> listPublishedAnnouncements(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        return announcementService.listPublishedAnnouncementsForUser(currentUser.getUserId());
    }
}
