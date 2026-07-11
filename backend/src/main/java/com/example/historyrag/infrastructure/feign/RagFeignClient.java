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
import feign.Headers;
import feign.RequestLine;
import feign.Param;

public interface RagFeignClient {

    @RequestLine("GET /rag/health")
    @Headers("Content-Type: application/json")
    RagHealthResponse getHealth();

    @RequestLine("POST /rag/chat")
    @Headers("Content-Type: application/json")
    RagChatResponse chat(RagChatRequest request);

    @RequestLine("POST /rag/chat/stream")
    @Headers({
        "Content-Type: application/json",
        "Accept: text/event-stream"
    })
    feign.Response streamChat(RagChatRequest request);

    @RequestLine("POST /rag/retrieve")
    @Headers("Content-Type: application/json")
    RagRetrieveResponse retrieve(RagRetrieveRequest request);

    @RequestLine("POST /rag/suggest-questions")
    @Headers("Content-Type: application/json")
    RagSuggestResponse suggestQuestions(RagSuggestRequest request);

    @RequestLine("POST /rag/ingest")
    @Headers("Content-Type: application/json")
    RagIngestResponse ingest(RagIngestRequest request);

    @RequestLine("DELETE /rag/delete?sourceId={sourceId}")
    RagDeleteResponse deleteSource(@Param("sourceId") Long sourceId);
}
