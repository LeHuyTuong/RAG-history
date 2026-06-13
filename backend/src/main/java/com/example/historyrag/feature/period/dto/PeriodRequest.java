package com.example.historyrag.feature.period.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PeriodRequest(

        String name,
        String slug,
        Integer startYear,
        Integer endYear,
        String description
) {}