package com.example.historyrag.feature.rag.dto;

public record RagIngestedChunkResponse(
        Integer chunkIndex,
        String qdrantPointId,
        String contentHash
) {
}
