package com.example.historyrag.feature.tag.dto;

import com.example.historyrag.feature.tag.Tag;
import java.time.Instant;

public record TagResponse(
        Long id,
        String name,
        String slug,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
    public static TagResponse fromEntity(Tag tag) {
        return new TagResponse(
                tag.getId(),
                tag.getName(),
                tag.getSlug(),
                tag.getDescription(),
                tag.getCreatedAt(),
                tag.getUpdatedAt()
        );
    }
}
