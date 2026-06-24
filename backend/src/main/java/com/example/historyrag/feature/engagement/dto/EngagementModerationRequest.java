package com.example.historyrag.feature.engagement.dto;


import lombok.Builder;
import com.example.historyrag.feature.engagement.CommentStatus;
import jakarta.validation.constraints.NotNull;

@Builder
public record EngagementModerationRequest(
        @NotNull(message = "Comment status is required")
        CommentStatus status
) {}