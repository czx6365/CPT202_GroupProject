package com.cpt202_1.taskmanager.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cpt202_1.taskmanager.pojo.Tag;

public interface TagRepository extends JpaRepository<Tag, Long> {
    //JpaRepository<Tag, Long>
    // 表示 管理的实体类是 Tag 主键类型是 Long
//继承它后自动获得
//     save(tag)         保存
// findById(id)    按 id 查
// findAll()       查全部
// deleteById(id)  按 id 删除 
// existsById(id)  判断是否存在
// count()         统计数量
    Optional<Tag> findByNameIgnoreCase(String name);

    List<Tag> findByNameIn(Collection<String> names);
}
