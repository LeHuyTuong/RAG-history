package com.example.historyrag.feature.rag.dto;

import java.util.Collections;
import java.util.List;

public record RagChatResponse(
        String answer,
        List<RagCitationResponse> citations,
        Boolean usedVector,
        Boolean usedGraph
) {
    public RagChatResponse {
        citations = citations == null ? Collections.emptyList() : List.copyOf(citations);
        usedVector = usedVector != null && usedVector;
        usedGraph = usedGraph != null && usedGraph;
    }
}
