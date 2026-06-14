package com.nortear.auth.controller;

import com.nortear.auth.dto.GoalRequest;
import com.nortear.auth.dto.GoalResponse;
import com.nortear.auth.mapper.GoalMapper;
import com.nortear.auth.model.user.User;
import com.nortear.auth.repository.GoalRepository;
import com.nortear.auth.service.GoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/me/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;
    private final GoalRepository goalRepository;
    private final GoalMapper goalMapper;

    @GetMapping
    public ResponseEntity<List<GoalResponse>> list(@AuthenticationPrincipal User user) {
        List<GoalResponse> goals = goalRepository.findByUser_Id(user.getId())
                .stream()
                .map(goalMapper::toResponse)
                .toList();
        return ResponseEntity.ok(goals);
    }

    @PostMapping
    public ResponseEntity<GoalResponse> create(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid GoalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(goalService.create(user.getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalResponse> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody @Valid GoalRequest request) {
        return ResponseEntity.ok(goalService.update(id, user.getId(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        goalService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
