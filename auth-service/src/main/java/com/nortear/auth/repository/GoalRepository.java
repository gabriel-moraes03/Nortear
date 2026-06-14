package com.nortear.auth.repository;

import com.nortear.auth.model.goal.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByUser_Id(Long userId);
    Optional<Goal> findByIdAndUser_Id(Long id, Long userId);
}
