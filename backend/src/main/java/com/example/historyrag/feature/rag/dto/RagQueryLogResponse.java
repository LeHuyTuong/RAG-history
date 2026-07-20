package com.example.historyrag.feature.rag.dto;

import lombok.Builder;

@Builder
public record RagQueryLogResponse(
        String id,
        String question,
        String answer,
        String model,
        Boolean usedVector,
        Boolean usedGraph,
        Boolean usedWeb,
        String transport,
        Long latencyMs,
        String createdAt
) {}
