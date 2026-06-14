package com.nortear.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record SkillRequest(@NotBlank String name) {}
