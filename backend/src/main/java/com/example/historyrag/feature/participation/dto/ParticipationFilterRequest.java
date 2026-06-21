package com.example.historyrag.feature.participation.dto;

import com.example.historyrag.feature.participation.ParticipationRole;

public record ParticipationFilterRequest(
        Long eventId,
        Long personId,
        ParticipationRole role
) {}
