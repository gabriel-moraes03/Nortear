package com.nortear.chat.controller;

import com.nortear.chat.client.VagasClient;
import com.nortear.chat.dto.EmbeddingVagaDto;
import com.nortear.chat.dto.VagaResponse;
import com.nortear.chat.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/vagas")
@RequiredArgsConstructor
public class VagasController {

    private final VagasClient vagasClient;

    @GetMapping
    public ResponseEntity<List<VagaResponse>> getVagas(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "20") int limit) {
        List<VagaResponse> vagas = vagasClient.searchVagas(principal.userId(), Math.min(limit, 50))
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(vagas);
    }

    private VagaResponse toResponse(EmbeddingVagaDto dto) {
        return new VagaResponse(
                dto.vagaId(),
                orEmpty(dto.titulo()),
                orEmpty(dto.empresa()),
                orEmpty(dto.localizacao()),
                orEmpty(dto.modelo()),
                orEmpty(dto.senioridade()),
                dto.skills() != null ? dto.skills() : List.of(),
                "",
                orEmpty(dto.url()),
                (int) Math.round(dto.similarity() * 100)
        );
    }

    private String orEmpty(String s) {
        return s != null ? s : "";
    }
}
