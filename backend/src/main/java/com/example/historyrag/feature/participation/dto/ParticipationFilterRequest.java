package com.example.historyrag.feature.participation.dto;


import lombok.Builder;
import com.example.historyrag.feature.participation.ParticipationRole;

@Builder
public record ParticipationFilterRequest(
        Long eventId,
        Long personId,
        ParticipationRole role
) {}
