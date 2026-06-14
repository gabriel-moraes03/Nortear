package com.nortear.auth.controller;

import com.nortear.auth.dto.UpdateUserRequest;
import com.nortear.auth.dto.UserResponse;
import com.nortear.auth.mapper.UserMapper;
import com.nortear.auth.model.user.User;
import com.nortear.auth.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userMapper.toResponse(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> update(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid UpdateUserRequest request) {
        return ResponseEntity.ok(userService.update(user.getId(), request));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user) {
        userService.delete(user.getId());
        return ResponseEntity.noContent().build();
    }
}
