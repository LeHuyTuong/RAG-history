package com.example.historyrag.feature.rag.dto;


import lombok.Builder;
import java.util.Collections;
import java.util.List;

@Builder
public record RagChatResponse(
        String answer,
        List<RagCitationResponse> citations,
        Boolean usedVector,
        Boolean usedGraph,
        List<String> suggestions
) {
    public RagChatResponse {
        citations = citations == null ? Collections.emptyList() : List.copyOf(citations);
        usedVector = usedVector != null && usedVector;
        usedGraph = usedGraph != null && usedGraph;
        suggestions = suggestions == null ? Collections.emptyList() : List.copyOf(suggestions);
    }
}
