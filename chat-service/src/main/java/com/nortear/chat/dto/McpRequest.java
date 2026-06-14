package com.nortear.chat.dto;

import java.util.List;
import java.util.UUID;

public record McpRequest(
        Long userId,
        UUID sessionId,
        String message,
        List<MessageHistory> history
) {
    public record MessageHistory(String sender, String content) {}
}
