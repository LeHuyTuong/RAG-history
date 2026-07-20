package com.example.historyrag.feature.location.dto;

import java.util.Collections;
import java.util.ArrayList;
import java.util.Arrays;

import java.util.List;
import org.springframework.data.repository.query.Param;

import com.example.historyrag.feature.post.PostStatus;

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
        PostStatus status,
        List<String> dynasty,
        String imageUrl,
        Instant createdAt,
        Instant updatedAt,
        List<FigureDTO> famousCharacters,
        List<TimelineDTO> timeline,
        List<StatDTO> stats
) {
    public static LocationResponse fromEntity(Location location) {
        return fromEntityWithExtra(location, Collections.emptyList(), Collections.emptyList(), Collections.emptyList());
    }


    public static LocationResponse fromEntityWithExtra(Location location, List<FigureDTO> famousCharacters, List<TimelineDTO> timeline, List<StatDTO> stats) {
        List<String> dynastyList = new ArrayList<>();

        if (location.getDynasty() != null && !location.getDynasty().trim().isEmpty()) {
            dynastyList = Arrays.asList(location.getDynasty().split("\\s*,\\s*"));
        }

        return new LocationResponse(
                location.getId(),
                location.getName(),
                location.getSlug(),
                location.getLocationType(),
                location.getLatitude(),
                location.getLongitude(),
                location.getDescription(),
                location.getStatus(),
                dynastyList,
                location.getImageUrl(),
                location.getCreatedAt(),
                location.getUpdatedAt(),
                famousCharacters,
                timeline,
                stats);
    }

    public record FigureDTO(String name, String role, String img) {}
    public record TimelineDTO(String year, String title, String desc) {}
    public record StatDTO(String label, String value) {}
}
