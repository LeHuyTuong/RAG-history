package com.example.historyrag.feature.rag.dto;


import lombok.Builder;
import java.util.Collections;
import java.util.List;

@Builder
public record RagIngestResponse(
        Long sourceId,
        String status,
        String collection,
        String embeddingModel,
        List<RagIngestedChunkResponse> chunks
) {
    public RagIngestResponse {
        chunks = chunks == null ? Collections.emptyList() : List.copyOf(chunks);
    }
}
