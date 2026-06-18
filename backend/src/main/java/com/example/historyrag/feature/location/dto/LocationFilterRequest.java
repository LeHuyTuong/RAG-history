package com.example.historyrag.feature.location.dto;

import com.example.historyrag.feature.location.LocationType;

public record LocationFilterRequest(
        String keyword,
        LocationType locationType
) {}
