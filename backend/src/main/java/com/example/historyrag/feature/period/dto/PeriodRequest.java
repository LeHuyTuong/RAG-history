package com.example.historyrag.feature.period.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PeriodRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 50, message = "Name must not exceed 50 characters")
        String name,

        @NotBlank(message = "Slug is required")
        @Size(max = 50, message = "Slug must not exceed 50 characters")
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must be valid format")
        String slug,

        Integer startYear,
        Integer endYear,

        @Size(max = 100, message = "Description must not exceed 100 characters")
        String description
) {}