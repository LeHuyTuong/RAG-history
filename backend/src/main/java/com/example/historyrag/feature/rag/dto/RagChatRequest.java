package com.example.historyrag.feature.rag.dto;


import lombok.Builder;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Collections;
import java.util.List;

@Builder
public record RagChatRequest(
        @NotBlank(message = "Question is required")
        @Size(max = 2000, message = "Question must be at most 2000 characters")
        String question,

        @Min(value = 1, message = "topK must be at least 1")
        @Max(value = 20, message = "topK must be at most 20")
        Integer topK,

        Boolean useGraph,

        List<Long> sourceIds,

        List<Long> tagIds,

        @DecimalMin(value = "0.0", message = "temperature must be at least 0")
        @DecimalMax(value = "1.0", message = "temperature must be at most 1")
        Double temperature
) {
    public RagChatRequest {
        useGraph = useGraph != null && useGraph;
        sourceIds = sourceIds == null ? Collections.emptyList() : List.copyOf(sourceIds);
        tagIds = tagIds == null ? Collections.emptyList() : List.copyOf(tagIds);
        temperature = temperature == null ? 0.2 : temperature;
    }
}
