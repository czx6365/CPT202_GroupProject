package com.cpt202_1.taskmanager.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cpt202_1.taskmanager.dto.response.AnnouncementView;
import com.cpt202_1.taskmanager.service.AnnouncementService;

@RestController
@RequestMapping("/api/public/announcements")
public class PublicAnnouncementController {
    private final AnnouncementService announcementService;

    public PublicAnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @GetMapping
    public List<AnnouncementView> listPublicAnnouncements() {
        return announcementService.listPublicAnnouncements();
    }
}
