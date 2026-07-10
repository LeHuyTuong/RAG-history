package com.example.historyrag.feature.rag;

import com.example.historyrag.dto.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class FeedbackController {

    private final ChatFeedbackRepository repository;

    public record FeedbackRequest(
            @NotBlank String question,
            @NotBlank String answer,
            boolean usedWeb,
            String sourceUrl,
            @NotBlank @Pattern(regexp = "GOOD|BAD|INSUFFICIENT") String rating
    ) {}

    @PostMapping("/feedback")
    public ResponseEntity<ApiResponse<Map<String, Long>>> postFeedback(
            @RequestBody @Valid FeedbackRequest request) {
        ChatFeedback feedback = ChatFeedback.builder()
                .question(request.question())
                .answer(request.answer())
                .usedWeb(request.usedWeb())
                .sourceUrl(request.sourceUrl())
                .rating(request.rating())
                .build();
        ChatFeedback saved = repository.save(feedback);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("feedbackId", saved.getId())));
    }
}
