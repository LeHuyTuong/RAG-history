package com.example.historyrag.feature.period;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PeriodRepository extends JpaRepository<Period, Long> {
    Optional<Period> findBySlug(String slug);
    boolean existsByName(String name);
    boolean existsBySlug(String slug);
}