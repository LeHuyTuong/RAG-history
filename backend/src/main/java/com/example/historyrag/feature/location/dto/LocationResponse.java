package com.example.historyrag.feature.location.dto;


import lombok.Builder;
import com.example.historyrag.feature.location.Location;
import com.example.historyrag.feature.location.LocationType;

import java.math.BigDecimal;
import java.time.Instant;

@Builder
public record LocationResponse(
        Long id,
        String name,
        String slug,
        LocationType locationType,
        BigDecimal latitude,
        BigDecimal longitude,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
    public static LocationResponse fromEntity(Location location) {
        return new LocationResponse(
                location.getId(),
                location.getName(),
                location.getSlug(),
                location.getLocationType(),
                location.getLatitude(),
                location.getLongitude(),
                location.getDescription(),
                location.getCreatedAt(),
                location.getUpdatedAt()
        );
    }
}
