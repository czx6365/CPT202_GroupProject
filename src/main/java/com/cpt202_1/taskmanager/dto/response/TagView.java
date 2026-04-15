package com.cpt202_1.taskmanager.dto.response;

public record TagView(
        Long tagId,
        String name,
        long usageCount,
        boolean inUse) {
}
