package com.example.historyrag.feature.engagement.dto;

import com.example.historyrag.feature.engagement.CommentStatus;
import jakarta.validation.constraints.NotNull;

public record EngagementModerationRequest(
        @NotNull(message = "Comment status is required")
        CommentStatus status
) {}