package com.example.historyrag.feature.rag.dto;


import lombok.Builder;
@Builder
public record RagIngestedChunkResponse(
        Integer chunkIndex,
        String qdrantPointId,
        String contentHash
) {
}
