package com.example.historyrag.feature.rag.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Builder;
import java.util.Collections;
import java.util.List;

@Builder
public record RagSuggestRequest(
        List<Long> sourceIds,

        @Min(value = 1, message = "count must be at least 1")
        @Max(value = 10, message = "count must be at most 10")
        Integer count
) {
    public RagSuggestRequest {
        sourceIds = sourceIds == null ? Collections.emptyList() : List.copyOf(sourceIds);
        count = count == null ? 4 : count;
    }
}