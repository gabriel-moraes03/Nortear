package com.nortear.chat.dto;

import java.util.List;

public record UserCreatedEvent(
        Long userId,
        String email,
        String name,
        String vagaDesejada,
        List<String> skills
) {}
