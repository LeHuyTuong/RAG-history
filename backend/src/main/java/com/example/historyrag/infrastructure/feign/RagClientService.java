package com.example.historyrag.infrastructure.feign;

import com.example.historyrag.feature.rag.dto.RagChatRequest;
import com.example.historyrag.feature.rag.dto.RagChatResponse;
import com.example.historyrag.feature.rag.dto.RagDeleteResponse;
import com.example.historyrag.feature.rag.dto.RagHealthResponse;
import com.example.historyrag.feature.rag.dto.RagIngestRequest;
import com.example.historyrag.feature.rag.dto.RagIngestResponse;
import com.example.historyrag.feature.rag.dto.RagRetrieveRequest;
import com.example.historyrag.feature.rag.dto.RagRetrieveResponse;
import com.example.historyrag.feature.rag.dto.RagSuggestRequest;
import com.example.historyrag.feature.rag.dto.RagSuggestResponse;
import java.util.function.Consumer;

public interface RagClientService {

    RagHealthResponse getHealth(String traceparent);

    RagChatResponse chat(RagChatRequest request, String traceparent);

    // Non-blocking: starts background thread, calls callbacks as SSE events arrive.
    void streamChat(
            RagChatRequest request,
            String traceparent,
            Consumer<RagStreamEvent> onEvent,
            Consumer<Throwable> onError,
            Runnable onComplete);

    RagRetrieveResponse retrieve(RagRetrieveRequest request, String traceparent);

    RagSuggestResponse suggestQuestions(RagSuggestRequest request, String traceparent);

    RagIngestResponse ingest(RagIngestRequest request, String traceparent);

    RagDeleteResponse deleteSource(Long sourceId, String traceparent);
}
