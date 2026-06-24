package com.example.historyrag.feature.location.dto;


import lombok.Builder;
import com.example.historyrag.feature.location.LocationType;

@Builder
public record LocationFilterRequest(
        String keyword,
        LocationType locationType
) {}
