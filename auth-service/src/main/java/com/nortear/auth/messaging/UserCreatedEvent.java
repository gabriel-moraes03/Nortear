package com.nortear.auth.messaging;

import java.util.List;

public record UserCreatedEvent(Long userId, String vagaDesejada, List<String> skills) {}
