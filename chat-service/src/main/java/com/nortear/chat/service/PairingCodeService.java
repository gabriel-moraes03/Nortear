package com.nortear.chat.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PairingCodeService {

    // code → telegramChatId
    private final Map<String, Long> codeToChat = new ConcurrentHashMap<>();

    public String generateCode(Long telegramChatId) {
        // Remove código antigo para o mesmo chat (garante 1 código ativo por chat)
        codeToChat.values().removeIf(id -> id.equals(telegramChatId));

        String code = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        codeToChat.put(code, telegramChatId);
        return code;
    }

    public Optional<Long> consumeCode(String code) {
        Long chatId = codeToChat.remove(code.toUpperCase().trim());
        return Optional.ofNullable(chatId);
    }
}
