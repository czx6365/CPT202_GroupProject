package com.cpt202_1.taskmanager.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.cpt202_1.taskmanager.pojo.ResourceEntry;

public interface ResourceEntryRepository extends JpaRepository<ResourceEntry, Long>, JpaSpecificationExecutor<ResourceEntry> {
    List<ResourceEntry> findByContributorUserIdOrderByUpdatedAtDesc(Long contributorId);
}
