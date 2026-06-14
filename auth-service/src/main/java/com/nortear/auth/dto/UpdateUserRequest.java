package com.nortear.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateUserRequest(@NotBlank String name) {}
