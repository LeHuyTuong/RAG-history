package com.example.historyrag.feature.source;

import com.example.historyrag.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "source")
public class Source extends BaseEntity {
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
    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 50)
    private SourceType sourceType;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "reliability_level", length = 20)
    private ReliabilityLevel reliabilityLevel;

}
