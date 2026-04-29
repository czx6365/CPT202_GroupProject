package com.cpt202_1.taskmanager.service;

import java.util.HashSet;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.cpt202_1.taskmanager.dto.response.CommentView;
import com.cpt202_1.taskmanager.dto.response.ResourceDetail;
import com.cpt202_1.taskmanager.dto.response.ResourceSummary;
import com.cpt202_1.taskmanager.dto.response.UserSummary;
import com.cpt202_1.taskmanager.pojo.ResourceComment;
import com.cpt202_1.taskmanager.pojo.ResourceEntry;
import com.cpt202_1.taskmanager.pojo.Tag;
import com.cpt202_1.taskmanager.pojo.User;

@Component
public class PlatformViewMapper {
    public UserSummary toUserSummary(User user) {
        return new UserSummary(
                user.getUserId(),
                user.getUserName(),
                user.getEmail(),
                user.getRole(),
                user.isContributorApproved(),
                user.getContributorApplication(),
                user.getContributorRequestedAt(),
                user.getContributorRejectionReason());
    }

    public ResourceSummary toResourceSummary(ResourceEntry entry) {
        return new ResourceSummary(
                entry.getResourceId(),
                entry.getTitle(),
                entry.getTopic(),
                entry.getDescription(),
                entry.getPlaceName(),
                entry.getFileUrl(),
                entry.getExternalLink(),
                entry.getCopyrightDeclaration(),
                entry.getStatus(),
                entry.getReviewerFeedback(),
                entry.getContributor().getUserId(),
                entry.getContributor().getUserName(),
                entry.getCategory() == null ? null : entry.getCategory().getCategoryId(),
                entry.getCategory() == null ? null : entry.getCategory().getName(),
                entry.getTags().stream().map(Tag::getName).collect(Collectors.toCollection(HashSet::new)),
                entry.getCreatedAt(),
                entry.getUpdatedAt());
    }

    public ResourceDetail toResourceDetail(ResourceEntry entry) {
        return new ResourceDetail(
                entry.getResourceId(),
                entry.getTitle(),
                entry.getTopic(),
                entry.getPlaceName(),
                entry.getDescription(),
                entry.getFileUrl(),
                entry.getExternalLink(),
                entry.getCopyrightDeclaration(),
                entry.getStatus(),
                entry.getReviewerFeedback(),
                entry.getContributor().getUserId(),
                entry.getContributor().getUserName(),
                entry.getCategory() == null ? null : entry.getCategory().getCategoryId(),
                entry.getCategory() == null ? null : entry.getCategory().getName(),
                entry.getTags().stream().map(Tag::getName).collect(Collectors.toCollection(HashSet::new)),
                entry.getCreatedAt(),
                entry.getUpdatedAt(),
                entry.getReviewedAt(),
                entry.getPublishedAt(),
                entry.getArchivedAt());
    }

    public CommentView toCommentView(ResourceComment comment) {
        return new CommentView(
                comment.getCommentId(),
                comment.getAuthor().getUserId(),
                comment.getAuthor().getUserName(),
                comment.getContent(),
                comment.getCreatedAt());
    }
}
