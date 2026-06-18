package com.example.historyrag.feature.location.dto;

import com.example.historyrag.feature.location.LocationType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateLocationRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 255, message = "Name must not exceed 255 characters")
        String name,

        @NotBlank(message = "Slug is required")
        @Size(max = 255, message = "Slug must not exceed 255 characters")
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must be valid format")
        String slug,

        LocationType locationType,

        @DecimalMin(value = "-90.0", message = "Latitude must be greater than or equal to -90")
        @DecimalMax(value = "90.0", message = "Latitude must be less than or equal to 90")
        @Digits(integer = 2, fraction = 6, message = "Latitude must have at most 6 decimal places")
        BigDecimal latitude,

        @DecimalMin(value = "-180.0", message = "Longitude must be greater than or equal to -180")
        @DecimalMax(value = "180.0", message = "Longitude must be less than or equal to 180")
        @Digits(integer = 3, fraction = 6, message = "Longitude must have at most 6 decimal places")
        BigDecimal longitude,

        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        String description
) {}
