package com.nortear.auth.mapper;

import com.nortear.auth.dto.UpdateUserRequest;
import com.nortear.auth.dto.UserResponse;
import com.nortear.auth.model.goal.Goal;
import com.nortear.auth.model.skill.Skill;
import com.nortear.auth.model.user.User;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UserMapper implements BaseMapper<User, UpdateUserRequest, UserResponse> {

    @Override
    public User toEntity(UpdateUserRequest request) {
        return User.builder()
                .name(request.name())
                .build();
    }

    @Override
    public UserResponse toResponse(User user) {
        List<String> skills = user.getSkillList() == null ? List.of() :
                user.getSkillList().stream().map(Skill::getName).toList();
        List<String> goals = user.getGoalList() == null ? List.of() :
                user.getGoalList().stream().map(Goal::getName).toList();

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                skills,
                goals,
                user.getStatus().name()
        );
    }

    @Override
    public void copyProperties(UpdateUserRequest request, User user) {
        user.setName(request.name());
    }
}
