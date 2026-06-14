package com.nortear.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record GoalRequest(@NotBlank String name) {}
