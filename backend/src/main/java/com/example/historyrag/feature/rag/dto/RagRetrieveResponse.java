package com.example.historyrag.feature.rag.dto;


import lombok.Builder;
import java.util.Collections;
import java.util.List;

@Builder
public record RagRetrieveResponse(
        String question,
        Integer topK,
        List<RagRetrieveHitResponse> hits
) {
    public RagRetrieveResponse {
        hits = hits == null ? Collections.emptyList() : List.copyOf(hits);
    }
}
