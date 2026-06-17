package com.example.historyrag.feature.post.dto;

import com.example.historyrag.feature.post.PostStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public record CreatePostRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 100, message = "Title must not exceed 100 characters")
        String title,

        @NotBlank(message = "Slug is required")
        @Size(max = 200, message = "Slug must not exceed 200 characters")
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must be valid format")
        String slug,

        String summary,

        String content,

        @Size(max = 1000, message = "Thumbnail URL must not exceed 1000 characters")
        String thumbnailUrl,

        PostStatus status,

        Instant publishedAt,

        Long eventId,

        List<Long> tagIds
) {}
