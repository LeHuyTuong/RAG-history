package com.example.historyrag.feature.post;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    long countByStatus(String status);
}
