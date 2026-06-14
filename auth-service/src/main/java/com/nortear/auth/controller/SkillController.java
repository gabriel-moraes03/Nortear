package com.nortear.auth.controller;

import com.nortear.auth.dto.SkillRequest;
import com.nortear.auth.dto.SkillResponse;
import com.nortear.auth.mapper.SkillMapper;
import com.nortear.auth.model.user.User;
import com.nortear.auth.repository.SkillRepository;
import com.nortear.auth.service.SkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users/me/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;
    private final SkillRepository skillRepository;
    private final SkillMapper skillMapper;

    @GetMapping
    public ResponseEntity<List<SkillResponse>> list(@AuthenticationPrincipal User user) {
        List<SkillResponse> skills = skillRepository.findByUser_Id(user.getId())
                .stream()
                .map(skillMapper::toResponse)
                .toList();
        return ResponseEntity.ok(skills);
    }

    @PostMapping
    public ResponseEntity<SkillResponse> create(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid SkillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(skillService.create(user.getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SkillResponse> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody @Valid SkillRequest request) {
        return ResponseEntity.ok(skillService.update(id, user.getId(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        skillService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/byname/{name}")
    public ResponseEntity<Void> deleteByName(
            @AuthenticationPrincipal User user,
            @PathVariable String name) {
        skillService.deleteByName(name, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping
    public ResponseEntity<List<SkillResponse>> replaceAll(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, List<String>> body) {
        List<String> names = body.getOrDefault("names", List.of());
        return ResponseEntity.ok(skillService.replaceAll(user.getId(), names));
    }
}
