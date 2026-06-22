package com.example.historyrag.feature.event.dto;

import com.example.historyrag.feature.event.Event;
import com.example.historyrag.feature.event.EventCertaintyLevel;
import com.example.historyrag.feature.event.EventLocation;
import com.example.historyrag.feature.location.Location;
import com.example.historyrag.feature.location.LocationType;
import com.example.historyrag.feature.period.Period;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record EventResponse(
        Long id,
        String name,
        String slug,
        String description,
        PeriodSummary period,
        Integer startYear,
        Integer endYear,
        LocalDate startDate,
        LocalDate endDate,
        EventCertaintyLevel certaintyLevel,
        List<LocationRelationResponse> locationRelations,
        Instant createdAt,
        Instant updatedAt
) {
    public static EventResponse fromEntity(Event event) {
        List<LocationRelationResponse> locationRelations = event.getEventLocations() == null
                ? List.of()
                : event.getEventLocations().stream()
                        .map(LocationRelationResponse::fromEntity)
                        .toList();
        return new EventResponse(
                event.getId(),
                event.getName(),
                event.getSlug(),
                event.getDescription(),
                PeriodSummary.fromEntity(event.getPeriod()),
                event.getStartYear(),
                event.getEndYear(),
                event.getStartDate(),
                event.getEndDate(),
                event.getCertaintyLevel(),
                locationRelations,
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }

    public record PeriodSummary(
            Long id,
            String name,
            String slug
    ) {
        public static PeriodSummary fromEntity(Period period) {
            if (period == null) {
                return null;
            }
            return new PeriodSummary(period.getId(), period.getName(), period.getSlug());
        }
    }

    public record LocationRelationResponse(
            Long locationId,
            String name,
            String slug,
            LocationType locationType,
            String relationType
    ) {
        public static LocationRelationResponse fromEntity(EventLocation eventLocation) {
            Location location = eventLocation.getLocation();
            return new LocationRelationResponse(
                    location.getId(),
                    location.getName(),
                    location.getSlug(),
                    location.getLocationType(),
                    eventLocation.getRelationType()
            );
        }
    }
}
