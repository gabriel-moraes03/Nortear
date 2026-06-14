package com.nortear.chat.client;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class TelegramBotClient {

    private final RestClient telegramRestClient;

    public void sendMessage(Long chatId, String text) {
        telegramRestClient.post()
                .uri("/sendMessage")
                .body(Map.of("chat_id", chatId, "text", text, "parse_mode", "Markdown"))
                .retrieve()
                .toBodilessEntity();
    }
}
