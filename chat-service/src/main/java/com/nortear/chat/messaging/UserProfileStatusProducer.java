package com.nortear.chat.messaging;

import com.nortear.chat.dto.UserProfileCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserProfileStatusProducer {

    private static final String TOPIC = "user-profile-events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishProfileStatus(UserProfileCreatedEvent event) {
        log.info("Publicando UserProfileCreatedEvent: userId={}, status={}", event.userId(), event.status());
        kafkaTemplate.send(TOPIC, String.valueOf(event.userId()), event);
    }
}
