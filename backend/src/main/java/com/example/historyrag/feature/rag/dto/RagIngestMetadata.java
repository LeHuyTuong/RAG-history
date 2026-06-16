package com.example.historyrag.feature.rag.dto;

import java.util.Collections;
import java.util.List;

public record RagIngestMetadata(
        Long categoryId,
        String categoryName,
        String slug,
        List<Long> tagIds,
        List<Long> eventIds,
        List<Long> periodIds
) {
    public RagIngestMetadata {
        tagIds = tagIds == null ? Collections.emptyList() : List.copyOf(tagIds);
        eventIds = eventIds == null ? Collections.emptyList() : List.copyOf(eventIds);
        periodIds = periodIds == null ? Collections.emptyList() : List.copyOf(periodIds);
    }

    public static RagIngestMetadata empty() {
        return new RagIngestMetadata(null, null, null, List.of(), List.of(), List.of());
    }
}
