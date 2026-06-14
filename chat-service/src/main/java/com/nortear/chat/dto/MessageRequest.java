package com.nortear.chat.dto;

import jakarta.validation.constraints.NotBlank;

public record MessageRequest(@NotBlank String content) {}
