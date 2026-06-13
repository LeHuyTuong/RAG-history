package com.example.historyrag.feature.tag.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TagRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 0, message = "Name must not exceed 50 characters")
        String name,

        @NotBlank(message = "Slug is required")
        @Size(max = 100, message = "Slug must not exceed 100 characters")
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must be valid format (lowercase, hyphen-separated)")
        String slug,

        @Size(max = 500, message = "Description must not exceed 500 characters")
        String description
) {}