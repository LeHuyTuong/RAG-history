package com.example.historyrag.feature.period.dto;

import com.example.historyrag.feature.period.Period;
import java.time.Instant;

public record PeriodResponse(
        Long id,
        String name,
        String slug,
        Integer startYear,
        Integer endYear,
        String description,
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
                period.getCreatedAt(),
                period.getUpdatedAt()
        );
    }
}