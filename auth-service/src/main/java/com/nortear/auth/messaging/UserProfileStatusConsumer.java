package com.nortear.auth.messaging;

import com.nortear.auth.model.user.UserStatus;
import com.nortear.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserProfileStatusConsumer {

    private final UserRepository userRepository;

    @KafkaListener(topics = "user-profile-events", groupId = "auth-saga-group")
    public void consumeProfileStatus(UserProfileCreatedEvent event) {
        log.info("Recebendo user-profile-events userId={} status={}", event.userId(), event.status());

        userRepository.findById(event.userId()).ifPresent(user -> {
            UserStatus newStatus = "SUCCESS".equals(event.status())
                    ? UserStatus.ACTIVE
                    : UserStatus.REGISTRATION_FAILED;
            user.setStatus(newStatus);
            userRepository.save(user);
            log.info("Status do userId={} atualizado para {}", event.userId(), newStatus);
        });
    }
}
