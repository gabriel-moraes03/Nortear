package com.nortear.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "api.security.token")
public record JwtProperties(String secret, long expirationInsideMs) {}
