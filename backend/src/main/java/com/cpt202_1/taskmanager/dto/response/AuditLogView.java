package com.cpt202_1.taskmanager.dto.response;

import java.time.LocalDateTime;

public record AuditLogView(
        Long id,
        Long operatorId,
        String operatorName,
        String module,
        String action,
        String targetType,
        Long targetId,
        String targetName,
        String detail,
        String status,
        LocalDateTime createdAt) {
}
