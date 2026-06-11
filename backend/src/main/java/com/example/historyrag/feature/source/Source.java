package com.example.historyrag.feature.source;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "source")
public class Source {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "source_id", nullable = false)
    private Long id;

    @Size(max = 500)
    @NotNull
    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Size(max = 50)
    @NotNull
    @Column(name = "source_type", nullable = false, length = 50)
    private String sourceType;

    @Size(max = 1000)
    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Size(max = 1000)
    @Column(name = "file_path", length = 1000)
    private String filePath;

    @Lob
    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content;

    @Size(max = 255)
    @Column(name = "author")
    private String author;

    @Column(name = "publication_year")
    private Integer publicationYear;

    @Size(max = 20)
    @Column(name = "reliability_level", length = 20)
    private String reliabilityLevel;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;


}
