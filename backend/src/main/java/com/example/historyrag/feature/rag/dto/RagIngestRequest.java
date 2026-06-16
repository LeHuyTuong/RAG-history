package com.example.historyrag.feature.rag.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RagIngestRequest(
        @NotNull(message = "sourceId is required")
        Long sourceId,

        @NotBlank(message = "sourceType is required")
        String sourceType,

        @NotBlank(message = "title is required")
        String title,

        Long articleId,
        Long documentId,
        String filePath,
        String sourceUrl,
        String rawContent,

        @Valid
        RagIngestMetadata metadata,

        @Valid
        RagIngestSettings settings
) {
    public RagIngestRequest {
        metadata = metadata == null ? RagIngestMetadata.empty() : metadata;
        settings = settings == null ? RagIngestSettings.empty() : settings;
    }

    @AssertTrue(message = "One of filePath, sourceUrl, or rawContent is required")
    @JsonIgnore
    public boolean hasContentInput() {
        return hasText(filePath) || hasText(sourceUrl) || hasText(rawContent);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
