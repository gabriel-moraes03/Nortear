package com.nortear.chat.controller;

import com.nortear.chat.dto.TelegramLinkRequest;
import com.nortear.chat.dto.TelegramUpdatePayload;
import com.nortear.chat.model.telegram.TelegramUserMapping;
import com.nortear.chat.repository.TelegramUserMappingRepository;
import com.nortear.chat.security.UserPrincipal;
import com.nortear.chat.service.PairingCodeService;
import com.nortear.chat.service.TelegramWebhookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/telegram")
@RequiredArgsConstructor
public class TelegramWebhookController {

    private final TelegramWebhookService telegramWebhookService;
    private final PairingCodeService pairingCodeService;
    private final TelegramUserMappingRepository telegramUserMappingRepository;

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleTelegramUpdate(@RequestBody TelegramUpdatePayload payload) {
        if (payload.message() == null || payload.message().text() == null) {
            return ResponseEntity.ok().build();
        }
        log.debug("Telegram update recebido: chatId={}", payload.message().chat().id());
        telegramWebhookService.processTelegramMessage(payload.message().chat().id(), payload.message().text());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/link")
    public ResponseEntity<Map<String, Object>> linkTelegramAccount(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody @Valid TelegramLinkRequest request) {

        Long telegramChatId = pairingCodeService.consumeCode(request.code())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código inválido ou expirado"));

        // Upsert: remove vínculo antigo do usuário, se existir
        telegramUserMappingRepository.findByUserId(principal.userId())
                .ifPresent(telegramUserMappingRepository::delete);

        TelegramUserMapping mapping = new TelegramUserMapping();
        mapping.setUserId(principal.userId());
        mapping.setTelegramChatId(telegramChatId);
        telegramUserMappingRepository.save(mapping);

        log.info("Telegram vinculado: userId={} chatId={}", principal.userId(), telegramChatId);
        return ResponseEntity.ok(Map.of("telegramChatId", telegramChatId.toString()));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus(@AuthenticationPrincipal UserPrincipal principal) {
        return telegramUserMappingRepository.findByUserId(principal.userId())
                .map(m -> ResponseEntity.ok(Map.<String, Object>of(
                        "linked", true,
                        "telegramChatId", m.getTelegramChatId().toString())))
                .orElse(ResponseEntity.ok(Map.of("linked", false)));
    }
}
