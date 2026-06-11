package com.example.historyrag.feature.post;

import com.example.historyrag.feature.admin.Admin;
import com.example.historyrag.feature.event.Event;
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
@Table(name = "post")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    private Admin admin;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "event_id")
    private Event event;

    @Size(max = 500)
    @NotNull
    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Size(max = 500)
    @NotNull
    @Column(name = "slug", nullable = false, length = 500)
    private String slug;

    @Lob
    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Lob
    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content;

    @Size(max = 1000)
    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    @NotNull
    @Enumerated(EnumType.STRING)
    @ColumnDefault("'DRAFT'")
    @Column(name = "status", nullable = false, length = 20)
    private PostStatus status;

    @Column(name = "published_at")
    private Instant publishedAt;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;


}
