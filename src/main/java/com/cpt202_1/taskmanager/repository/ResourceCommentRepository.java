package com.cpt202_1.taskmanager.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cpt202_1.taskmanager.pojo.ResourceComment;

public interface ResourceCommentRepository extends JpaRepository<ResourceComment, Long> {
    List<ResourceComment> findByResourceResourceIdOrderByCreatedAtAsc(Long resourceId);
}
