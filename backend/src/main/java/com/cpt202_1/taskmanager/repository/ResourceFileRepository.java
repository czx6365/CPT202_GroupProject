package com.cpt202_1.taskmanager.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cpt202_1.taskmanager.pojo.ResourceFile;

public interface ResourceFileRepository extends JpaRepository<ResourceFile, String> {
}
