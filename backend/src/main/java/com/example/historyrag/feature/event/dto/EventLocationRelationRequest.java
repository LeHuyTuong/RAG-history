package com.example.historyrag.feature.event.dto;


import lombok.Builder;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Builder
public record EventLocationRelationRequest(
        @NotNull(message = "Location id is required")
        Long locationId,

        @Size(max = 50, message = "Relation type must not exceed 50 characters")
        @Pattern(regexp = "^[A-Z_]*$", message = "Relation type must be a valid enum-like value")
        String relationType
) {
}
