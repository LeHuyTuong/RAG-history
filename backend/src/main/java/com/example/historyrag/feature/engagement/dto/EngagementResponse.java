package com.example.historyrag.feature.engagement.dto;


import lombok.Builder;
import com.example.historyrag.feature.engagement.CommentStatus;
import com.example.historyrag.feature.engagement.Engagement;
import java.time.Instant;

import com.example.historyrag.feature.engagement.EngagementType;

@Builder
public record EngagementResponse(
        Long id,
        Long memberId,
        String memberName,
        Long postId,
        Long parentEngagementId,
        EngagementType engagementType,
        String commentContent,
        CommentStatus commentStatus,
        Instant createdAt
) {
    public static EngagementResponse fromEntity(Engagement engagement) {
        return new EngagementResponse(
                engagement.getId(),
                engagement.getMember() != null ? engagement.getMember().getId() : null,
                engagement.getMember() != null ? engagement.getMember().getFullName() : null,
                engagement.getPost() != null ? engagement.getPost().getId() : null,
                engagement.getParentEngagement() != null ? engagement.getParentEngagement().getId() : null,
                engagement.getEngagementType(),
                engagement.getCommentContent(),
                engagement.getCommentStatus(),
                engagement.getCreatedAt()
        );
    }
}