package com.nortear.chat.controller;

import com.nortear.chat.dto.ChatSessionResponse;
import com.nortear.chat.dto.MessageRequest;
import com.nortear.chat.dto.MessageResponse;
import com.nortear.chat.security.UserPrincipal;
import com.nortear.chat.service.ChatOrchestratorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatOrchestratorService chatOrchestratorService;

    @PostMapping
    public ResponseEntity<ChatSessionResponse> createSession(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatOrchestratorService.createSession(principal.userId()));
    }

    @PostMapping("/{sessionId}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID sessionId,
            @RequestBody @Valid MessageRequest request) {
        return ResponseEntity.ok(
                chatOrchestratorService.processUserMessage(principal.userId(), sessionId, request.content()));
    }

    @GetMapping("/{sessionId}/history")
    public ResponseEntity<List<MessageResponse>> getHistory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID sessionId) {
        return ResponseEntity.ok(
                chatOrchestratorService.getHistory(principal.userId(), sessionId));
    }
}
