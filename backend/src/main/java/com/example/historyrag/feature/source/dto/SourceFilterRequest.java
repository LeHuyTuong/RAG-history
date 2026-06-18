package com.example.historyrag.feature.source.dto;

import com.example.historyrag.feature.source.ReliabilityLevel;
import com.example.historyrag.feature.source.SourceType;

public record SourceFilterRequest(
        String keyword,
        SourceType sourceType,
        ReliabilityLevel reliabilityLevel,
        Integer publicationYear
) {}
