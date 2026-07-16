package com.example.historyrag.feature.period;

import com.example.historyrag.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.example.historyrag.feature.post.PostStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "period", uniqueConstraints = {
        @UniqueConstraint(columnNames = "name"),
        @UniqueConstraint(columnNames = "slug")
})
public class Period extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "period_id", nullable = false)
    private Long id;

    @Size(max = 255)
    @NotNull
    @Column(name = "name", nullable = false)
    private String name;

    @Size(max = 255)
    @NotNull
    @Column(name = "slug", nullable = false)
    private String slug;

    @Column(name = "start_year")
    private Integer startYear;

    @Column(name = "end_year")
    private Integer endYear;

    @Column(name = "emperors", columnDefinition = "TEXT")
    private String emperors;

    @Column(name = "related_locations", columnDefinition = "TEXT")
    private String relatedLocations;

    @Column(name = "related_events", columnDefinition = "TEXT")
    private String relatedEvents;

    @Column(name = "related_articles", columnDefinition = "TEXT")
    private String relatedArticles;

    @Lob
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "philosophy", length = 500)
    private String philosophy;

    @Lob
    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private PostStatus status = PostStatus.PUBLISHED;

}
