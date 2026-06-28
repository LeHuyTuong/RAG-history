package com.example.historyrag.feature.source.dto;


import lombok.Builder;
import com.example.historyrag.feature.source.ReliabilityLevel;
import com.example.historyrag.feature.source.SourceType;

@Builder
public record SourceFilterRequest(
        String keyword,
        SourceType sourceType,
        ReliabilityLevel reliabilityLevel,
        Integer publicationYear
) {}
