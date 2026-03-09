package com.cpt202_1.taskmanager.dto.request;

import com.cpt202_1.taskmanager.pojo.enums.ReviewDecision;

public record ReviewRequest(
        ReviewDecision decision,
        String feedback) {
}
