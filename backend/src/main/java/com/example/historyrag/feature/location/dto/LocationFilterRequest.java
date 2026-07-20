package com.example.historyrag.feature.location.dto;

import com.example.historyrag.feature.post.PostStatus;


import lombok.Builder;
import com.example.historyrag.feature.location.LocationType;

@Builder
public record LocationFilterRequest(
        String keyword,
        LocationType locationType,
        PostStatus status
) {}
