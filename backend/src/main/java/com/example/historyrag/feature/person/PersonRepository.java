package com.example.historyrag.feature.person;

import com.example.historyrag.feature.post.PostStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonRepository extends JpaRepository<Person, Long> {

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    Page<Person> findByNameContainingIgnoreCase(String keyword, Pageable pageable);

    Page<Person> findByStatus(PostStatus status, Pageable pageable);

    Page<Person> findByNameContainingIgnoreCaseAndStatus(String keyword, PostStatus status, Pageable pageable);
}
