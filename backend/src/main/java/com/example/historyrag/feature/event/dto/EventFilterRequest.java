package com.example.historyrag.feature.event.dto;


import lombok.Builder;
import com.example.historyrag.feature.event.EventCertaintyLevel;

@Builder
public record EventFilterRequest(
        String keyword,
        Long periodId,
        Long locationId,
        EventCertaintyLevel certaintyLevel,
        Integer startYearFrom,
        Integer startYearTo
) {}
