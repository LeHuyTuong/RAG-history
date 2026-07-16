package com.example.historyrag.feature.period;
import com.example.historyrag.feature.post.PostStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PeriodRepository extends JpaRepository<Period, Long> {
    Optional<Period> findBySlug(String slug);
    boolean existsByName(String name);
    boolean existsBySlug(String slug);
    Page<Period> findByNameContainingIgnoreCase(String keyword, Pageable pageable);
    Page<Period> findByStatus(PostStatus status, Pageable pageable);
    Page<Period> findByNameContainingIgnoreCaseAndStatus(String keyword,
            PostStatus status, Pageable pageable);
}