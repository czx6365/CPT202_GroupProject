package com.cpt202_1.taskmanager.dto.request;

import com.cpt202_1.taskmanager.pojo.enums.AnnouncementStatus;

public record AnnouncementStatusRequest(
        AnnouncementStatus status) {
}
