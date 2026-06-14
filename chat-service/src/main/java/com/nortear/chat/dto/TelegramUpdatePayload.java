package com.nortear.chat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TelegramUpdatePayload(
        @JsonProperty("update_id") Long updateId,
        @JsonProperty("message") TelegramMessage message
) {
    public record TelegramMessage(
            @JsonProperty("message_id") Long messageId,
            @JsonProperty("chat") TelegramChat chat,
            @JsonProperty("text") String text
    ) {}

    public record TelegramChat(
            @JsonProperty("id") Long id
    ) {}
}
