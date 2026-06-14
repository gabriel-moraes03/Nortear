package com.nortear.auth.repository;

import com.nortear.auth.model.skill.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SkillRepository extends JpaRepository<Skill, Long> {
    List<Skill> findByUser_Id(Long userId);
    Optional<Skill> findByIdAndUser_Id(Long id, Long userId);
    Optional<Skill> findByNameAndUser_Id(String name, Long userId);
    void deleteByUser_Id(Long userId);
}
