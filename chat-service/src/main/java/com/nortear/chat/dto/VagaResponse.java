package com.nortear.chat.dto;

import java.util.List;

public record VagaResponse(
        String id,
        String titulo,
        String empresa,
        String localizacao,
        String modalidade,
        String nivel,
        List<String> skills,
        String descricao,
        String url,
        int matchScore
) {}
