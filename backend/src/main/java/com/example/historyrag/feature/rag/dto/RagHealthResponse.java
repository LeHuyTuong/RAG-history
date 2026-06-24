package com.example.historyrag.feature.rag.dto;


import lombok.Builder;
@Builder
public record RagHealthResponse(
        String status,
        String service
) {
}
