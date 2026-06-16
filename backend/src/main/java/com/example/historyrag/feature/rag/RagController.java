package com.example.historyrag.feature.rag;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.feature.rag.dto.RagChatRequest;
import com.example.historyrag.feature.rag.dto.RagChatResponse;
import com.example.historyrag.feature.rag.dto.RagDeleteResponse;
import com.example.historyrag.feature.rag.dto.RagHealthResponse;
import com.example.historyrag.feature.rag.dto.RagIngestRequest;
import com.example.historyrag.feature.rag.dto.RagIngestResponse;
import com.example.historyrag.feature.rag.dto.RagRetrieveRequest;
import com.example.historyrag.feature.rag.dto.RagRetrieveResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/rag")
public class RagController {

    private final RagService ragService;

    public RagController(RagService ragService) {
        this.ragService = ragService;
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<RagHealthResponse>> getHealth(
            @RequestHeader(value = "traceparent", required = false) String traceparent) {
        return ResponseEntity.ok(ApiResponse.success(ragService.getHealth(traceparent)));
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<RagChatResponse>> chat(
            @RequestBody @Valid RagChatRequest request,
            @RequestHeader(value = "traceparent", required = false) String traceparent) {
        return ResponseEntity.ok(ApiResponse.success(ragService.chat(request, traceparent)));
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(
            @RequestBody @Valid RagChatRequest request,
            @RequestHeader(value = "traceparent", required = false) String traceparent) {
        return ragService.streamChat(request, traceparent);
    }

    @PostMapping("/retrieve")
    public ResponseEntity<ApiResponse<RagRetrieveResponse>> retrieve(
            @RequestBody @Valid RagRetrieveRequest request,
            @RequestHeader(value = "traceparent", required = false) String traceparent) {
        return ResponseEntity.ok(ApiResponse.success(ragService.retrieve(request, traceparent)));
    }

    @PostMapping("/ingest")
    public ResponseEntity<ApiResponse<RagIngestResponse>> ingest(
            @RequestBody @Valid RagIngestRequest request,
            @RequestHeader(value = "traceparent", required = false) String traceparent) {
        return ResponseEntity.ok(ApiResponse.success(ragService.ingest(request, traceparent)));
    }

    @DeleteMapping("/sources/{sourceId}")
    public ResponseEntity<ApiResponse<RagDeleteResponse>> deleteSource(
            @PathVariable Long sourceId,
            @RequestHeader(value = "traceparent", required = false) String traceparent) {
        return ResponseEntity.ok(ApiResponse.success(ragService.deleteSource(sourceId, traceparent)));
    }
}
