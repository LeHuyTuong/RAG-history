package com.example.historyrag.feature.person.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PersonRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 255, message = "Name must not exceed 255 characters")
        String name,

        @NotBlank(message = "Slug is required")
        @Size(max = 255, message = "Slug must not exceed 255 characters")
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must be valid format")
        String slug,

        @Size(max = 255, message = "Alias must not exceed 255 characters")
        String alias,

        @PastOrPresent(message = "Birth date cannot be in the future")
        LocalDate birthDate,

        @PastOrPresent(message = "Death date cannot be in the future")
        LocalDate deathDate,

        @Size(max = 10000, message = "Biography must not exceed 10000 characters")
        String biography
) {
    @AssertTrue(message = "Death date must be after birth date")
    public boolean isValidLifeRange() {
        if (birthDate == null || deathDate == null) {
            return true;
        }
        return !deathDate.isBefore(birthDate);
    }
}
