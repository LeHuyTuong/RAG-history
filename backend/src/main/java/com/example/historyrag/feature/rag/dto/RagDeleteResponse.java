package com.example.historyrag.feature.rag.dto;


import lombok.Builder;
@Builder
public record RagDeleteResponse(
        String status,
        Long sourceId
) {
}
