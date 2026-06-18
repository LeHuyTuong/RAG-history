package com.example.historyrag.feature.source.dto;

import com.example.historyrag.feature.source.ReliabilityLevel;
import com.example.historyrag.feature.source.Source;
import com.example.historyrag.feature.source.SourceType;

import java.time.Instant;

public record SourceResponse(
        Long id,
        String title,
        SourceType sourceType,
        String sourceUrl,
        String filePath,
        String content,
        String author,
        Integer publicationYear,
        ReliabilityLevel reliabilityLevel,
        Instant createdAt,
        Instant updatedAt
) {
    public static SourceResponse fromEntity(Source source) {
        return new SourceResponse(
                source.getId(),
                source.getTitle(),
                source.getSourceType(),
                source.getSourceUrl(),
                source.getFilePath(),
                source.getContent(),
                source.getAuthor(),
                source.getPublicationYear(),
                source.getReliabilityLevel(),
                source.getCreatedAt(),
                source.getUpdatedAt()
        );
    }
}
