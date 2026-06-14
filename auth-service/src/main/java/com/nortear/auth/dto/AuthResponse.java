package com.nortear.auth.dto;

public record AuthResponse(String token, UserResponse user) {}
