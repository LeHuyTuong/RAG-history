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
import com.example.historyrag.feature.rag.dto.RagQueryLogResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

public class RagFeignClientAdapter implements RagClientService {

    private final RagFeignClient feignClient;
    private final ExecutorService streamExecutor = Executors.newVirtualThreadPerTaskExecutor();

    public RagFeignClientAdapter(RagFeignClient feignClient) {
        this.feignClient = feignClient;
    }

    @Override
    public RagHealthResponse getHealth(String traceparent) {
        TraceparentInterceptor.set(traceparent);
        try {
            return feignClient.getHealth();
        } finally {
            TraceparentInterceptor.clear();
        }
    }

    @Override
    public List<RagQueryLogResponse> getLogs(
            Integer limit,
            String question,
            Boolean usedVector,
            Boolean usedGraph,
            Boolean usedWeb,
            String transport,
            String traceparent) {
        TraceparentInterceptor.set(traceparent);
        try {
            Map<String, Object> params = new LinkedHashMap<>();
            if (limit != null) {
                params.put("limit", limit);
            }
            if (question != null && !question.isBlank()) {
                params.put("question", question);
            }
            if (usedVector != null) {
                params.put("usedVector", usedVector);
            }
            if (usedGraph != null) {
                params.put("usedGraph", usedGraph);
            }
            if (usedWeb != null) {
                params.put("usedWeb", usedWeb);
            }
            if (transport != null && !transport.isBlank()) {
                params.put("transport", transport);
            }
            return feignClient.getLogs(params);
        } finally {
            TraceparentInterceptor.clear();
        }
    }

    @Override
    public RagChatResponse chat(RagChatRequest request, String traceparent) {
        TraceparentInterceptor.set(traceparent);
        try {
            return feignClient.chat(request);
        } finally {
            TraceparentInterceptor.clear();
        }
    }

    @Override
    public void streamChat(
            RagChatRequest request,
            String traceparent,
            Consumer<RagStreamEvent> onEvent,
            Consumer<Throwable> onError,
            Runnable onComplete) {
        streamExecutor.submit(() -> {
            TraceparentInterceptor.set(traceparent);
            try (feign.Response response = feignClient.streamChat(request)) {
                parseSseStream(response, onEvent);
                onComplete.run();
            } catch (Exception ex) {
                onError.accept(ex);
            } finally {
                TraceparentInterceptor.clear();
            }
        });
    }

    @Override
    public RagSuggestResponse suggestQuestions(RagSuggestRequest request, String traceparent) {
        TraceparentInterceptor.set(traceparent);
        try {
            return feignClient.suggestQuestions(request);
        } finally {
            TraceparentInterceptor.clear();
        }
    }

    @Override
    public RagRetrieveResponse retrieve(RagRetrieveRequest request, String traceparent) {
        TraceparentInterceptor.set(traceparent);
        try {
            return feignClient.retrieve(request);
        } finally {
            TraceparentInterceptor.clear();
        }
    }

    @Override
    public RagIngestResponse ingest(RagIngestRequest request, String traceparent) {
        TraceparentInterceptor.set(traceparent);
        try {
            return feignClient.ingest(request);
        } finally {
            TraceparentInterceptor.clear();
        }
    }

    @Override
    public RagDeleteResponse deleteSource(Long sourceId, String traceparent) {
        TraceparentInterceptor.set(traceparent);
        try {
            return feignClient.deleteSource(sourceId);
        } finally {
            TraceparentInterceptor.clear();
        }
    }

    private void parseSseStream(feign.Response response, Consumer<RagStreamEvent> onEvent) throws IOException {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(response.body().asInputStream(), StandardCharsets.UTF_8))) {
            String eventName = "message";
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.startsWith("event:")) {
                    String name = line.substring("event:".length()).strip();
                    eventName = name.isBlank() ? "message" : name;
                } else if (line.startsWith("data:")) {
                    String data = line.substring("data:".length()).strip();
                    onEvent.accept(new RagStreamEvent(eventName, data.isBlank() ? "{}" : data));
                    eventName = "message";
                }
            }
        }
    }
}
