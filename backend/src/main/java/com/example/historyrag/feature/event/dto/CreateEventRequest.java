package com.example.historyrag.feature.event.dto;

import com.example.historyrag.feature.event.EventCertaintyLevel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record CreateEventRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 500, message = "Name must not exceed 500 characters")
        String name,

        @NotBlank(message = "Slug is required")
        @Size(max = 500, message = "Slug must not exceed 500 characters")
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must be valid format")
        String slug,

        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        String description,

        Long periodId,

        Integer startYear,

        Integer endYear,

        LocalDate startDate,

        LocalDate endDate,

        EventCertaintyLevel certaintyLevel,

        List<@Valid EventLocationRelationRequest> locationRelations
) {}
