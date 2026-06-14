package com.nortear.chat.dto;

import jakarta.validation.constraints.NotBlank;

public record TelegramLinkRequest(@NotBlank String code) {}
