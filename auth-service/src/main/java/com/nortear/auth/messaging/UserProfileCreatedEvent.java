package com.nortear.auth.messaging;

public record UserProfileCreatedEvent(Long userId, String status) {}
