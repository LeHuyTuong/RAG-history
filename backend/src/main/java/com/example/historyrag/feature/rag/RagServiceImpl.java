package com.example.historyrag.feature.rag;

import com.example.historyrag.feature.rag.dto.RagChatRequest;
import com.example.historyrag.feature.rag.dto.RagChatResponse;
import com.example.historyrag.feature.rag.dto.RagDeleteResponse;
import com.example.historyrag.feature.rag.dto.RagHealthResponse;
import com.example.historyrag.feature.rag.dto.RagIngestRequest;
import com.example.historyrag.feature.rag.dto.RagIngestResponse;
import com.example.historyrag.feature.rag.dto.RagRetrieveRequest;
import com.example.historyrag.feature.rag.dto.RagRetrieveResponse;
import com.example.historyrag.infrastructure.webclient.RagClientService;
import com.example.historyrag.infrastructure.webclient.RagStreamEvent;
import java.io.IOException;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.Disposable;

@Service
public class RagServiceImpl implements RagService {

    private static final long STREAM_TIMEOUT_MS = 180_000L;

    private final RagClientService ragClientService;

    public RagServiceImpl(RagClientService ragClientService) {
        this.ragClientService = ragClientService;
    }

    @Override
    public RagHealthResponse getHealth(String traceparent) {
        return ragClientService.getHealth(traceparent);
    }

    @Override
    public RagChatResponse chat(RagChatRequest request, String traceparent) {
        return ragClientService.chat(request, traceparent);
    }

    @Override
    public SseEmitter streamChat(RagChatRequest request, String traceparent) {
        SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT_MS);
        AtomicReference<Disposable> subscription = new AtomicReference<>();

        Disposable disposable = ragClientService.streamChat(
                request,
                traceparent,
                event -> sendEvent(emitter, event),
                error -> completeWithStreamError(emitter),
                emitter::complete);
        subscription.set(disposable);

        emitter.onTimeout(() -> dispose(subscription));
        emitter.onCompletion(() -> dispose(subscription));
        emitter.onError(error -> dispose(subscription));
        return emitter;
    }

    @Override
    public RagRetrieveResponse retrieve(RagRetrieveRequest request, String traceparent) {
        return ragClientService.retrieve(request, traceparent);
    }

    @Override
    public RagIngestResponse ingest(RagIngestRequest request, String traceparent) {
        return ragClientService.ingest(request, traceparent);
    }

    @Override
    public RagDeleteResponse deleteSource(Long sourceId, String traceparent) {
        return ragClientService.deleteSource(sourceId, traceparent);
    }

    private void sendEvent(SseEmitter emitter, RagStreamEvent event) {
        try {
            emitter.send(SseEmitter.event()
                    .name(event.name())
                    .data(event.data()));
        } catch (IOException ex) {
            emitter.completeWithError(ex);
        }
    }

    private void completeWithStreamError(SseEmitter emitter) {
        sendEvent(emitter, new RagStreamEvent("chat.error", "{\"message\":\"RAG stream failed\"}"));
        emitter.complete();
    }

    private void dispose(AtomicReference<Disposable> subscription) {
        Disposable disposable = subscription.get();
        if (disposable != null && !disposable.isDisposed()) {
            disposable.dispose();
        }
    }
}
