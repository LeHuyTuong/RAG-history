package com.example.historyrag.feature.participation.dto;

import com.example.historyrag.feature.participation.ParticipationRole;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateParticipationRequest(
        @NotNull(message = "Event id is required")
        Long eventId,

        @NotNull(message = "Person id is required")
        Long personId,

        ParticipationRole role,

        @Size(max = 5000, message = "Note must not exceed 5000 characters")
        String note,

        @DecimalMin(value = "0.00", message = "Confidence must be greater than or equal to 0.00")
        @DecimalMax(value = "1.00", message = "Confidence must be less than or equal to 1.00")
        @Digits(integer = 1, fraction = 2, message = "Confidence must have at most 2 decimal places")
        BigDecimal confidence
) {}
