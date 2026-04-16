package com.cpt202_1.taskmanager.dto.response;

public record CategoryView(
        Long categoryId,
        String name,
        String description,
        long usageCount,
        boolean inUse) {
}
