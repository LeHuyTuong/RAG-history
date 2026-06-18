package com.example.historyrag.feature.source.dto;

import com.example.historyrag.feature.source.ReliabilityLevel;
import com.example.historyrag.feature.source.SourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateSourceRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 500, message = "Title must not exceed 500 characters")
        String title,

        @NotNull(message = "Source type is required")
        SourceType sourceType,

        @Size(max = 1000, message = "Source URL must not exceed 1000 characters")
        @Pattern(regexp = "^(https?://.+)?$", message = "Source URL must start with http:// or https://")
        String sourceUrl,

        @Size(max = 1000, message = "File path must not exceed 1000 characters")
        String filePath,

        String content,

        @Size(max = 255, message = "Author must not exceed 255 characters")
        String author,

        Integer publicationYear,

        ReliabilityLevel reliabilityLevel
) {}
