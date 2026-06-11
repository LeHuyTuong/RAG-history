package com.example.historyrag.feature.engagement;

import com.example.historyrag.feature.user.Member;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "engagement")
public class Engagement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "engagement_id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "parent_engagement_id")
    private Engagement parentEngagement;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "engagement_type", nullable = false, length = 20)
    private EngagementType engagementType;

    @Lob
    @Column(name = "comment_content", columnDefinition = "TEXT")
    private String commentContent;

    @Enumerated(EnumType.STRING)
    @Column(name = "comment_status", length = 20)
    private CommentStatus commentStatus;

    @Column(name = "rating_value")
    private Integer ratingValue;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;


}
