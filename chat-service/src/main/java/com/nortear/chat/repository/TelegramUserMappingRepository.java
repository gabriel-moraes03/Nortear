package com.nortear.chat.repository;

import com.nortear.chat.model.telegram.TelegramUserMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TelegramUserMappingRepository extends JpaRepository<TelegramUserMapping, Long> {

    Optional<TelegramUserMapping> findByTelegramChatId(Long telegramChatId);
    Optional<TelegramUserMapping> findByUserId(Long userId);
}
