package com.example.historyrag.feature.period.dto;


import lombok.Builder;
import com.example.historyrag.feature.period.Period;
import java.time.Instant;
import com.example.historyrag.feature.post.PostStatus;

@Builder
public record PeriodResponse(
        Long id,
        String name,
        String slug,
        Integer startYear,
        Integer endYear,
        String description,
        String philosophy,
        String imageUrl,
        String emperors,
        String relatedLocations,
        String relatedEvents,
        String relatedArticles,
        PostStatus status,
        Instant createdAt,
        Instant updatedAt

) {
    public static PeriodResponse fromEntity(Period period) {
        return new PeriodResponse(
                period.getId(),
                period.getName(),
                period.getSlug(),
                period.getStartYear(),
                period.getEndYear(),
                period.getDescription(),
                period.getPhilosophy(),
                period.getImageUrl(),
                period.getEmperors(),
                period.getRelatedLocations(),
                period.getRelatedEvents(),
                period.getRelatedArticles(),
                period.getStatus(),
                period.getCreatedAt(),
                period.getUpdatedAt()
        );
    }
}
