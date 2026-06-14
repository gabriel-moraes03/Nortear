package com.nortear.chat.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatSessionResponse(UUID id, Long userId, LocalDateTime createdAt) {}
