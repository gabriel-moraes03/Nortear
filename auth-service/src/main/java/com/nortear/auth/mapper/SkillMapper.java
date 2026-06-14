package com.nortear.auth.mapper;

import com.nortear.auth.dto.SkillRequest;
import com.nortear.auth.dto.SkillResponse;
import com.nortear.auth.model.skill.Skill;
import org.springframework.stereotype.Component;

@Component
public class SkillMapper implements BaseMapper<Skill, SkillRequest, SkillResponse> {

    @Override
    public Skill toEntity(SkillRequest request) {
        return Skill.builder()
                .name(request.name())
                .build();
    }

    @Override
    public SkillResponse toResponse(Skill skill) {
        return new SkillResponse(skill.getId(), skill.getName());
    }

    @Override
    public void copyProperties(SkillRequest request, Skill skill) {
        skill.setName(request.name());
    }
}
