package com.example.historyrag.feature.rag.dto;


import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Collections;
import java.util.List;

@Builder
public record RagChatRequest(
        @Schema(example = "Quang Trung là ai?", description = "Câu hỏi của người dùng",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Question is required")
        @Size(max = 2000, message = "Question must be at most 2000 characters")
        String question,

        @Schema(example = "5", defaultValue = "5", description = "Số đoạn ngữ cảnh lấy ra (1-20)")
        @Min(value = 1, message = "topK must be at least 1")
        @Max(value = 20, message = "topK must be at most 20")
        Integer topK,

        @Schema(example = "false", defaultValue = "false", description = "Có dùng tri thức đồ thị (Neo4j) hay không")
        Boolean useGraph,

        @ArraySchema(arraySchema = @Schema(example = "[]",
                description = "Lọc theo nguồn (sourceId ≥ 1). Để trống = tìm trên toàn bộ dữ liệu"))
        List<Long> sourceIds,

        @ArraySchema(arraySchema = @Schema(example = "[]",
                description = "Lọc theo tag (tagId ≥ 1). Để trống = tìm trên toàn bộ dữ liệu"))
        List<Long> tagIds,

        @Schema(example = "0.2", defaultValue = "0.2", description = "Độ sáng tạo của câu trả lời (0.0 - 1.0)")
        @DecimalMin(value = "0.0", message = "temperature must be at least 0")
        @DecimalMax(value = "1.0", message = "temperature must be at most 1")
        Double temperature
) {
    public RagChatRequest {
        useGraph = useGraph != null && useGraph;
        sourceIds = sourceIds == null ? Collections.emptyList() : List.copyOf(sourceIds);
        tagIds = tagIds == null ? Collections.emptyList() : List.copyOf(tagIds);
        temperature = temperature == null ? 0.2 : temperature;
    }
}
