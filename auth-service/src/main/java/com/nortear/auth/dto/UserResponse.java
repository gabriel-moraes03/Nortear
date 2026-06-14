package com.nortear.auth.dto;

import java.util.List;

public record UserResponse(
        Long id,
        String name,
        String email,
        List<String> skills,
        List<String> goals,
        String status
) {}
