package com.cpt202_1.taskmanager.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cpt202_1.taskmanager.pojo.Tag;

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByNameIgnoreCase(String name);

    List<Tag> findByNameIn(Collection<String> names);
}
