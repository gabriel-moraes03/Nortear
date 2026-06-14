package com.nortear.chat.dto;

import java.util.List;

public record EmbeddingVagaDto(
        String vagaId,
        String titulo,
        String empresa,
        String area,
        String senioridade,
        String modelo,
        List<String> skills,
        String url,
        String localizacao,
        double similarity
) {}
