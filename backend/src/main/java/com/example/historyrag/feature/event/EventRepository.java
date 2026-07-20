package com.example.historyrag.feature.event;

import java.util.List;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.Query;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    @Query("SELECT e FROM Event e JOIN e.eventLocations el WHERE el.location.id = :locationId ORDER BY e.startYear ASC")
    List<Event> findEventsByLocationId(@Param("locationId") Long locationId);
}
