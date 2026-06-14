package com.nortear.auth.service;

import com.nortear.auth.dto.GoalRequest;
import com.nortear.auth.dto.GoalResponse;
import com.nortear.auth.mapper.GoalMapper;
import com.nortear.auth.model.goal.Goal;
import com.nortear.auth.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final GoalMapper goalMapper;
    private final UserService userService;

    @Transactional
    public GoalResponse create(Long userId, GoalRequest request) {
        Goal goal = goalMapper.toEntity(request);
        goal.setUser(userService.findById(userId));
        return goalMapper.toResponse(goalRepository.save(goal));
    }

    @Transactional
    public GoalResponse update(Long goalId, Long userId, GoalRequest request) {
        Goal goal = findByIdAndUserId(goalId, userId);
        goalMapper.copyProperties(request, goal);
        return goalMapper.toResponse(goalRepository.save(goal));
    }

    @Transactional
    public void delete(Long goalId, Long userId) {
        Goal goal = findByIdAndUserId(goalId, userId);
        goalRepository.delete(goal);
    }

    private Goal findByIdAndUserId(Long goalId, Long userId) {
        return goalRepository.findByIdAndUser_Id(goalId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meta não encontrada"));
    }
}
