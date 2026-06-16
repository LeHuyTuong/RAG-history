package com.example.historyrag.feature.rag.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Collections;
import java.util.List;

public record RagRetrieveRequest(
        @NotBlank(message = "Question is required")
        @Size(max = 2000, message = "Question must be at most 2000 characters")
        String question,

        @Min(value = 1, message = "topK must be at least 1")
        @Max(value = 20, message = "topK must be at most 20")
        Integer topK,

        List<Long> sourceIds,
        List<Long> tagIds
) {
    public RagRetrieveRequest {
        sourceIds = sourceIds == null ? Collections.emptyList() : List.copyOf(sourceIds);
        tagIds = tagIds == null ? Collections.emptyList() : List.copyOf(tagIds);
    }
}
