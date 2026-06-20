package com.example.historyrag.feature.event;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {
    Optional<Event> findBySlug(String slug);
    boolean existsBySlug(String slug);

    @Query("SELECT e FROM Event e " +
           "WHERE (:keyword IS NULL OR LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:periodId IS NULL OR e.period.id = :periodId) " +
           "AND (:fromYear IS NULL OR e.startYear >= :fromYear) " +
           "AND (:toYear IS NULL OR e.endYear <= :toYear) " +
           "AND (:certaintyLevel IS NULL OR e.certaintyLevel = :certaintyLevel)")
    Page<Event> filter(
            @Param("keyword") String keyword,
            @Param("periodId") Long periodId,
            @Param("fromYear") Integer fromYear,
            @Param("toYear") Integer toYear,
            @Param("certaintyLevel") String certaintyLevel,
            Pageable pageable);
}