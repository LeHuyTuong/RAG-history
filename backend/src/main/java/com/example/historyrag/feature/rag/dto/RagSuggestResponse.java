package com.example.historyrag.feature.rag.dto;

import lombok.Builder;
import java.util.Collections;
import java.util.List;

@Builder
public record RagSuggestResponse(
        List<String> questions,
        List<Long> sourceIds
) {
    public RagSuggestResponse {
        questions = questions == null ? Collections.emptyList() : List.copyOf(questions);
        sourceIds = sourceIds == null ? Collections.emptyList() : List.copyOf(sourceIds);
    }
}
