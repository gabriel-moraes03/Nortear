package com.nortear.chat.client;

import com.nortear.chat.dto.McpRequest;
import com.nortear.chat.dto.McpResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class McpClient {

    private final RestClient mcpRestClient;

    public McpResponse sendPromptToMcp(McpRequest request) {
        return mcpRestClient.post()
                .uri("/mcp/prompt")
                .body(request)
                .retrieve()
                .body(McpResponse.class);
    }

    public void initializeUserProfile(Long userId, String vagaDesejada, java.util.List<String> skills) {
        var payload = new java.util.HashMap<String, Object>();
        payload.put("userId", userId);
        payload.put("vagaDesejada", vagaDesejada);
        payload.put("skills", skills);

        mcpRestClient.post()
                .uri("/mcp/user/init")
                .body(payload)
                .retrieve()
                .toBodilessEntity();
    }
}
