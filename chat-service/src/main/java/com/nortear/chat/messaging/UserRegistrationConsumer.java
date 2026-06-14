package com.nortear.chat.messaging;

import com.nortear.chat.client.McpClient;
import com.nortear.chat.dto.UserCreatedEvent;
import com.nortear.chat.dto.UserProfileCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserRegistrationConsumer {

    private final McpClient mcpClient;
    private final UserProfileStatusProducer userProfileStatusProducer;

    @KafkaListener(topics = "user-registration-events", groupId = "chatms-saga-group")
    public void consumeUserCreatedEvent(UserCreatedEvent event) {
        log.info("Recebendo UserCreatedEvent para userId={}", event.userId());
        try {
            mcpClient.initializeUserProfile(event.userId(), event.vagaDesejada(), event.skills());
            log.info("Perfil vetorizado com sucesso para userId={}", event.userId());
            userProfileStatusProducer.publishProfileStatus(
                    new UserProfileCreatedEvent(event.userId(), "SUCCESS"));
        } catch (Exception e) {
            log.error("Falha ao inicializar perfil no MCP para userId={}: {}", event.userId(), e.getMessage());
            userProfileStatusProducer.publishProfileStatus(
                    new UserProfileCreatedEvent(event.userId(), "FAILED"));
        }
    }
}
