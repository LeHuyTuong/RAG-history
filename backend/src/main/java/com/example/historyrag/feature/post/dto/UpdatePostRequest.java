package com.example.historyrag.feature.post.dto;

import com.example.historyrag.feature.post.PostStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public record UpdatePostRequest(
        @NotNull(message = "Id is required")
        Long id,

        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must not exceed 200 characters")
        String title,

        @NotBlank(message = "Slug is required")
        @Size(max = 500, message = "Slug must not exceed 500 characters")
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must be valid format")
        String slug,

        String summary,

        String content,

        @Size(max = 1000, message = "Thumbnail URL must not exceed 1000 characters")
        String thumbnailUrl,

        @NotNull(message = "Status is required")
        PostStatus status,

        Instant publishedAt,

        Long eventId,

        List<Long> tagIds
) {}
