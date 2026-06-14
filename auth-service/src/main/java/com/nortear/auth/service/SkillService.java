package com.nortear.auth.service;

import com.nortear.auth.dto.SkillRequest;
import com.nortear.auth.dto.SkillResponse;
import com.nortear.auth.mapper.SkillMapper;
import com.nortear.auth.model.skill.Skill;
import com.nortear.auth.model.user.User;
import com.nortear.auth.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;
    private final SkillMapper skillMapper;
    private final UserService userService;

    @Transactional
    public SkillResponse create(Long userId, SkillRequest request) {
        Skill skill = skillMapper.toEntity(request);
        skill.setUser(userService.findById(userId));
        return skillMapper.toResponse(skillRepository.save(skill));
    }

    @Transactional
    public SkillResponse update(Long skillId, Long userId, SkillRequest request) {
        Skill skill = findByIdAndUserId(skillId, userId);
        skillMapper.copyProperties(request, skill);
        return skillMapper.toResponse(skillRepository.save(skill));
    }

    @Transactional
    public void delete(Long skillId, Long userId) {
        Skill skill = findByIdAndUserId(skillId, userId);
        skillRepository.delete(skill);
    }

    @Transactional
    public void deleteByName(String name, Long userId) {
        Skill skill = skillRepository.findByNameAndUser_Id(name, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Skill não encontrada"));
        skillRepository.delete(skill);
    }

    @Transactional
    public List<SkillResponse> replaceAll(Long userId, List<String> names) {
        skillRepository.deleteByUser_Id(userId);
        User user = userService.findById(userId);
        return names.stream()
                .filter(n -> n != null && !n.isBlank())
                .map(n -> {
                    Skill s = Skill.builder().name(n.trim()).user(user).build();
                    return skillMapper.toResponse(skillRepository.save(s));
                })
                .toList();
    }

    private Skill findByIdAndUserId(Long skillId, Long userId) {
        return skillRepository.findByIdAndUser_Id(skillId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Skill não encontrada"));
    }
}
