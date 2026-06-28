package com.example.historyrag.feature.engagement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EngagementRepository extends JpaRepository<Engagement, Long> {

    long countByEngagementType(EngagementType engagementType);
    long countByEngagementTypeAndCommentStatus(EngagementType engagementType, CommentStatus commentStatus);

    Page<Engagement> findByEngagementTypeAndCommentStatus(
            EngagementType engagementType,
            CommentStatus commentStatus,
            Pageable pageable);

    List<Engagement> findByPostIdAndEngagementTypeAndCommentStatus(
            Long postId,
            EngagementType engagementType,
            CommentStatus commentStatus);
}
