package com.example.historyrag.feature.rag;

import com.example.historyrag.feature.rag.dto.RagChatRequest;
import com.example.historyrag.feature.rag.dto.RagChatResponse;
import com.example.historyrag.feature.rag.dto.RagDeleteResponse;
import com.example.historyrag.feature.rag.dto.RagHealthResponse;
import com.example.historyrag.feature.rag.dto.RagIngestRequest;
import com.example.historyrag.feature.rag.dto.RagIngestResponse;
import com.example.historyrag.feature.rag.dto.RagRetrieveRequest;
import com.example.historyrag.feature.rag.dto.RagRetrieveResponse;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface RagService {

    RagHealthResponse getHealth(String traceparent);

    RagChatResponse chat(RagChatRequest request, String traceparent);

    SseEmitter streamChat(RagChatRequest request, String traceparent);

    RagRetrieveResponse retrieve(RagRetrieveRequest request, String traceparent);

    RagIngestResponse ingest(RagIngestRequest request, String traceparent);

    RagDeleteResponse deleteSource(Long sourceId, String traceparent);
}
