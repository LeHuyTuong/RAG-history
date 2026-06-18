package com.example.historyrag.feature.period.dto;

import jakarta.validation.constraints.*;
import java.time.Year;

public record PeriodRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 50, message = "Name must not exceed 50 characters")
        String name,

        @NotBlank(message = "Slug is required")
        @Size(max = 50, message = "Slug must not exceed 50 characters")
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must be valid format")
        String slug,

        @NotNull(message = "Start year is required")
        Integer startYear,

        @NotNull(message = "End year is required")
        Integer endYear,

        @Size(max = 100, message = "Description must not exceed 100 characters")
        String description
) {
    @AssertTrue(message = "Start year must be in the past and before end year")
    public boolean isValidStartYear() {
        if (startYear == null || endYear == null) {
            return false;
        }
        int currentYear = Year.now().getValue();
        return startYear < currentYear && startYear < endYear;
    }

    @AssertTrue(message = "End year cannot be in the future")
    public boolean isValidEndYear() {
        if (endYear == null) {
            return false;
        }
        int currentYear = Year.now().getValue();
        return endYear <= currentYear;
    }
}