package com.example.historyrag.feature.rag.dto;


import lombok.Builder;
@Builder
public record RagRetrieveHitResponse(
        String sourceType,
        Long sourceId,
        Long articleId,
        Long documentId,
        String title,
        String slug,
        Integer pageNumber,
        Integer chunkIndex,
        Double score,
        String chunkText
) {
}
