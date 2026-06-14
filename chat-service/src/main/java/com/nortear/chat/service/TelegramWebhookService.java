package com.nortear.chat.service;

import com.nortear.chat.client.TelegramBotClient;
import com.nortear.chat.model.session.ChatSession;
import com.nortear.chat.repository.TelegramUserMappingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramWebhookService {

    private final TelegramUserMappingRepository telegramUserMappingRepository;
    private final ChatOrchestratorService chatOrchestratorService;
    private final TelegramBotClient telegramBotClient;
    private final PairingCodeService pairingCodeService;

    public void processTelegramMessage(Long telegramChatId, String textContent) {
        telegramUserMappingRepository.findByTelegramChatId(telegramChatId).ifPresentOrElse(
                mapping -> handleKnownUser(mapping.getUserId(), telegramChatId, textContent),
                () -> handleUnknownUser(telegramChatId)
        );
    }

    private void handleKnownUser(Long userId, Long telegramChatId, String textContent) {
        try {
            ChatSession session = chatOrchestratorService.findSessionOrCreateForUser(userId);
            String aiResponse = chatOrchestratorService
                    .processUserMessage(userId, session.getId(), textContent)
                    .content();
            telegramBotClient.sendMessage(telegramChatId, aiResponse);
        } catch (Exception e) {
            log.error("Erro ao processar mensagem do Telegram para userId={}: {}", userId, e.getMessage());
            telegramBotClient.sendMessage(telegramChatId,
                    "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em instantes.");
        }
    }

    private void handleUnknownUser(Long telegramChatId) {
        String code = pairingCodeService.generateCode(telegramChatId);
        String msg = String.format(
                "Olá! Para usar o Nortear pelo Telegram:\\n\\n" +
                "1\\. Acesse o painel web e vá em *Perfil → Telegram*\\n" +
                "2\\. Cole o código abaixo:\\n\\n" +
                "`%s`\\n\\n" +
                "O código expira quando um novo for solicitado\\.", code);
        telegramBotClient.sendMessage(telegramChatId, msg);
    }
}
