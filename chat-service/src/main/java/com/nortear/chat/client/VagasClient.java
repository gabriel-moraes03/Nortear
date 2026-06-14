package com.nortear.chat.client;

import com.nortear.chat.dto.EmbeddingVagaDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class VagasClient {

    private final RestClient embeddingRestClient;

    public List<EmbeddingVagaDto> searchVagas(Long userId, int limit) {
        try {
            EmbeddingVagaDto[] result = embeddingRestClient.get()
                    .uri("/search/vagas?userId={userId}&limit={limit}", userId, limit)
                    .retrieve()
                    .body(EmbeddingVagaDto[].class);
            return result != null ? List.of(result) : List.of();
        } catch (Exception e) {
            log.warn("Falha ao buscar vagas no embedding-service para userId={}: {}", userId, e.getMessage());
            return List.of();
        }
    }
}
