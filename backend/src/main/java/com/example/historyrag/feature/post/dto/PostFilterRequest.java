package com.example.historyrag.feature.post.dto;

import com.example.historyrag.feature.post.PostStatus;

public record PostFilterRequest(
        String keyword,
        PostStatus status,
        Long eventId,
        Long tagId,
        Long authorId
) {}
