package com.nortear.chat.model.telegram;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "telegram_user_mapping")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelegramUserMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "telegram_chat_id", nullable = false, unique = true)
    private Long telegramChatId;
}
