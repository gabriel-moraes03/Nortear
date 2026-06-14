package com.nortear.chat.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

@Configuration
public class McpClientConfig {

    @Bean
    public RestClient mcpRestClient(@Value("${mcp.server.url}") String mcpUrl) {
        return RestClient.builder()
                .baseUrl(mcpUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Bean
    public RestClient telegramRestClient(@Value("${telegram.bot.token}") String botToken) {
        return RestClient.builder()
                .baseUrl("https://api.telegram.org/bot" + botToken)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Bean
    public RestClient embeddingRestClient(@Value("${embedding.service.url}") String embeddingUrl) {
        return RestClient.builder()
                .baseUrl(embeddingUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}
