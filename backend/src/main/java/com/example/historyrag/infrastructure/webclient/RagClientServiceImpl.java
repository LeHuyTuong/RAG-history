package com.example.historyrag.infrastructure.webclient;

import com.example.historyrag.feature.rag.dto.RagChatRequest;
import com.example.historyrag.feature.rag.dto.RagChatResponse;
import com.example.historyrag.feature.rag.dto.RagDeleteResponse;
import com.example.historyrag.feature.rag.dto.RagHealthResponse;
import com.example.historyrag.feature.rag.dto.RagIngestRequest;
import com.example.historyrag.feature.rag.dto.RagIngestResponse;
import com.example.historyrag.feature.rag.dto.RagRetrieveRequest;
import com.example.historyrag.feature.rag.dto.RagRetrieveResponse;
import java.time.Duration;
import java.util.function.Consumer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.Disposable;

@Service
public class RagClientServiceImpl implements RagClientService {

    private static final String TRACE_PARENT_HEADER = "traceparent";

    private final WebClient webClient;
    private final Duration requestTimeout;

    public RagClientServiceImpl(
            WebClient.Builder webClientBuilder,
            @Value("${app.rag.base-url}") String ragBaseUrl,
            @Value("${app.rag.request-timeout:60s}") Duration requestTimeout) {
        this.webClient = webClientBuilder.baseUrl(ragBaseUrl).build();
        this.requestTimeout = requestTimeout;
    }

    @Override
    public RagHealthResponse getHealth(String traceparent) {
        return webClient.get()
                .uri("/rag/health")
                .headers(headers -> setTraceparent(headers, traceparent))
                .retrieve()
                .bodyToMono(RagHealthResponse.class)
                .block(requestTimeout);
    }

    @Override
    public RagChatResponse chat(RagChatRequest request, String traceparent) {
        return webClient.post()
                .uri("/rag/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .headers(headers -> setTraceparent(headers, traceparent))
                .bodyValue(request)
                .retrieve()
                .bodyToMono(RagChatResponse.class)
                .block(requestTimeout);
    }

    @Override
    public Disposable streamChat(
            RagChatRequest request,
            String traceparent,
            Consumer<RagStreamEvent> onEvent,
            Consumer<Throwable> onError,
            Runnable onComplete) {
        return webClient.post()
                .uri("/rag/chat/stream")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .headers(headers -> setTraceparent(headers, traceparent))
                .bodyValue(request)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<ServerSentEvent<String>>() {
                })
                .subscribe(
                        event -> onEvent.accept(toStreamEvent(event)),
                        onError,
                        onComplete);
    }

    @Override
    public RagRetrieveResponse retrieve(RagRetrieveRequest request, String traceparent) {
        return webClient.post()
                .uri("/rag/retrieve")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .headers(headers -> setTraceparent(headers, traceparent))
                .bodyValue(request)
                .retrieve()
                .bodyToMono(RagRetrieveResponse.class)
                .block(requestTimeout);
    }

    @Override
    public RagIngestResponse ingest(RagIngestRequest request, String traceparent) {
        return webClient.post()
                .uri("/rag/ingest")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .headers(headers -> setTraceparent(headers, traceparent))
                .bodyValue(request)
                .retrieve()
                .bodyToMono(RagIngestResponse.class)
                .block(requestTimeout);
    }

    @Override
    public RagDeleteResponse deleteSource(Long sourceId, String traceparent) {
        return webClient.delete()
                .uri(uriBuilder -> uriBuilder.path("/rag/delete").queryParam("sourceId", sourceId).build())
                .accept(MediaType.APPLICATION_JSON)
                .headers(headers -> setTraceparent(headers, traceparent))
                .retrieve()
                .bodyToMono(RagDeleteResponse.class)
                .block(requestTimeout);
    }

    private void setTraceparent(HttpHeaders headers, String traceparent) {
        if (traceparent != null && !traceparent.isBlank()) {
            headers.set(TRACE_PARENT_HEADER, traceparent);
        }
    }

    private RagStreamEvent toStreamEvent(ServerSentEvent<String> event) {
        String eventName = event.event() == null || event.event().isBlank()
                ? "message"
                : event.event();
        String data = event.data() == null || event.data().isBlank() ? "{}" : event.data();
        return new RagStreamEvent(eventName, data);
    }
}
