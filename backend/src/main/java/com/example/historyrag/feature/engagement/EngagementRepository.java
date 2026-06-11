package com.example.historyrag.feature.engagement;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EngagementRepository extends JpaRepository<Engagement, Long> {

    long countByEngagementType(EngagementType engagementType);

    long countByEngagementTypeAndCommentStatus(EngagementType engagementType, CommentStatus commentStatus);
}
