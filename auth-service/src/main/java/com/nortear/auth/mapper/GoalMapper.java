package com.nortear.auth.mapper;

import com.nortear.auth.dto.GoalRequest;
import com.nortear.auth.dto.GoalResponse;
import com.nortear.auth.model.goal.Goal;
import org.springframework.stereotype.Component;

@Component
public class GoalMapper implements BaseMapper<Goal, GoalRequest, GoalResponse> {

    @Override
    public Goal toEntity(GoalRequest request) {
        return Goal.builder()
                .name(request.name())
                .build();
    }

    @Override
    public GoalResponse toResponse(Goal goal) {
        return new GoalResponse(goal.getId(), goal.getName());
    }

    @Override
    public void copyProperties(GoalRequest request, Goal goal) {
        goal.setName(request.name());
    }
}
