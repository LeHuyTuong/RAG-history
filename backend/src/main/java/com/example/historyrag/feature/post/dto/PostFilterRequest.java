package com.example.historyrag.feature.post.dto;


import lombok.Builder;
import com.example.historyrag.feature.post.PostStatus;

@Builder
public record PostFilterRequest(
        String keyword,
        PostStatus status,
        Long eventId,
        Long tagId,
        Long authorId
) {}
