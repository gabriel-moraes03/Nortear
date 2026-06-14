package com.nortear.chat.service;

import com.nortear.chat.client.McpClient;
import com.nortear.chat.dto.ChatSessionResponse;
import com.nortear.chat.dto.McpRequest;
import com.nortear.chat.dto.MessageResponse;
import com.nortear.chat.model.message.ChatMessage;
import com.nortear.chat.model.message.MessageSender;
import com.nortear.chat.model.session.ChatSession;
import com.nortear.chat.repository.ChatMessageRepository;
import com.nortear.chat.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatOrchestratorService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final McpClient mcpClient;

    @Transactional
    public ChatSessionResponse createSession(Long userId) {
        ChatSession session = chatSessionRepository.save(ChatSession.builder().userId(userId).build());
        return new ChatSessionResponse(session.getId(), session.getUserId(), session.getCreatedAt());
    }

    @Transactional
    public MessageResponse processUserMessage(Long userId, UUID sessionId, String textContent) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sessão não encontrada"));

        if (!session.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sessão não pertence ao usuário");
        }

        chatMessageRepository.save(ChatMessage.builder()
                .session(session)
                .sender(MessageSender.USER)
                .content(textContent)
                .build());

        List<ChatMessage> recentMessages = chatMessageRepository
                .findTop10BySession_IdOrderByTimestampDesc(sessionId);
        Collections.reverse(recentMessages);

        List<McpRequest.MessageHistory> history = recentMessages.stream()
                .map(m -> new McpRequest.MessageHistory(m.getSender().name(), m.getContent()))
                .toList();

        McpRequest mcpRequest = new McpRequest(userId, sessionId, textContent, history);
        String aiText = mcpClient.sendPromptToMcp(mcpRequest).response();

        ChatMessage aiMessage = chatMessageRepository.save(ChatMessage.builder()
                .session(session)
                .sender(MessageSender.AI)
                .content(aiText)
                .build());

        return toResponse(aiMessage);
    }

    public List<MessageResponse> getHistory(Long userId, UUID sessionId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sessão não encontrada"));

        if (!session.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sessão não pertence ao usuário");
        }

        return chatMessageRepository.findBySession_IdOrderByTimestampAsc(sessionId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ChatSession findSessionOrCreateForUser(Long userId) {
        return chatSessionRepository.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .orElseGet(() -> chatSessionRepository.save(
                        ChatSession.builder().userId(userId).build()));
    }

    private MessageResponse toResponse(ChatMessage message) {
        return new MessageResponse(
                message.getId(),
                message.getSession().getId(),
                message.getSender().name(),
                message.getContent(),
                message.getTimestamp()
        );
    }
}
