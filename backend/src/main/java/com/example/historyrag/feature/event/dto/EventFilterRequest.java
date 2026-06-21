package com.example.historyrag.feature.event.dto;

import com.example.historyrag.feature.event.EventCertaintyLevel;

public record EventFilterRequest(
        String keyword,
        Long periodId,
        Long locationId,
        EventCertaintyLevel certaintyLevel,
        Integer startYearFrom,
        Integer startYearTo
) {}
