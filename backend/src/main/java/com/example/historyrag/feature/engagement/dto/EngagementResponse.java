package com.example.historyrag.feature.engagement.dto;

import com.example.historyrag.feature.engagement.CommentStatus;
import com.example.historyrag.feature.engagement.Engagement;
import java.time.Instant;

public record EngagementResponse(
        Long id,
        String commentContent,
        CommentStatus commentStatus,
        Instant createdAt
) {
    public static EngagementResponse fromEntity(Engagement engagement) {
        return new EngagementResponse(
                engagement.getId(),
                engagement.getCommentContent(),
                engagement.getCommentStatus(),
                engagement.getCreatedAt()
        );
    }
}