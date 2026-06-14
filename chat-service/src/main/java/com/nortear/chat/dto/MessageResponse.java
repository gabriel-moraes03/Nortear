package com.nortear.chat.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record MessageResponse(Long id, UUID sessionId, String sender, String content, LocalDateTime timestamp) {}
