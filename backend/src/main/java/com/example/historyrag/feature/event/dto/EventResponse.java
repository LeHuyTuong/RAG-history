package com.example.historyrag.feature.event.dto;

import com.example.historyrag.feature.event.Event;

import java.time.Instant;
import java.time.LocalDate;

public record EventResponse(
        Long id,
        String name,
        String slug,
        String description,
        Long periodId,
        String periodName,
        Integer startYear,
        Integer endYear,
        LocalDate startDate,
        LocalDate endDate,
        String certaintyLevel,
        Instant createdAt,
        Instant updatedAt
) {
    public static EventResponse fromEntity(Event event) {
        return new EventResponse(
                event.getId(),
                event.getName(),
                event.getSlug(),
                event.getDescription(),
                event.getPeriod() != null ? event.getPeriod().getId() : null,
                event.getPeriod() != null ? event.getPeriod().getName() : null,
                event.getStartYear(),
                event.getEndYear(),
                event.getStartDate(),
                event.getEndDate(),
                event.getCertaintyLevel(),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }
}
