package com.nortear.chat.repository;

import com.nortear.chat.model.message.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySession_IdOrderByTimestampAsc(UUID sessionId);

    List<ChatMessage> findTop10BySession_IdOrderByTimestampDesc(UUID sessionId);
}
