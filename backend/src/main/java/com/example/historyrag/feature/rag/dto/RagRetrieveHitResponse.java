package com.example.historyrag.feature.rag.dto;

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
