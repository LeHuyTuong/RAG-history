package com.example.historyrag.feature.rag.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record RagIngestSettings(
        @Min(value = 100, message = "chunkSize must be at least 100")
        @Max(value = 4000, message = "chunkSize must be at most 4000")
        Integer chunkSize,

        @Min(value = 0, message = "chunkOverlap must be at least 0")
        @Max(value = 1000, message = "chunkOverlap must be at most 1000")
        Integer chunkOverlap
) {
    public static RagIngestSettings empty() {
        return new RagIngestSettings(null, null);
    }
}
