package com.cpt202_1.taskmanager.dto.response;

import java.time.LocalDateTime;

public record CommentView(
        Long commentId,
        Long userId,
        String userName,
        String content,
        LocalDateTime createdAt) {
}
