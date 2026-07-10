package com.example.historyrag.feature.rag;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatFeedbackRepository extends JpaRepository<ChatFeedback, Long> {
}
