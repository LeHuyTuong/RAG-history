package com.example.historyrag.feature.location.dto;

import java.util.List;
import org.springframework.data.repository.query.Param;

import com.example.historyrag.feature.post.PostStatus;


import lombok.Builder;
import com.example.historyrag.feature.location.LocationType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Builder
public record UpdateLocationRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 255, message = "Name must not exceed 255 characters")
        String name,

        @NotBlank(message = "Slug is required")
        @Size(max = 255, message = "Slug must not exceed 255 characters")
        @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug must be valid format")
        String slug,

        LocationType locationType,

        @DecimalMin(value = "8.0", message = "Latitude must be greater than or equal to 8")
        @DecimalMax(value = "24.0", message = "Latitude must be less than or equal to 24")
        @Digits(integer = 2, fraction = 6, message = "Latitude must have at most 6 decimal places")
        BigDecimal latitude,

        @DecimalMin(value = "102.0", message = "Longitude must be greater than or equal to 102")
        @DecimalMax(value = "110.0", message = "Longitude must be less than or equal to 110")
        @Digits(integer = 3, fraction = 6, message = "Longitude must have at most 6 decimal places")
        BigDecimal longitude,

        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        String description,

        PostStatus status,

        List<String> dynasty,

        String imageUrl

) {}
