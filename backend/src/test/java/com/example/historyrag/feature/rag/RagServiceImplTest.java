package com.example.historyrag.feature.rag;

import com.example.historyrag.feature.rag.dto.RagChatRequest;
import com.example.historyrag.feature.rag.dto.RagChatResponse;
import com.example.historyrag.feature.rag.dto.RagDeleteResponse;
import com.example.historyrag.feature.rag.dto.RagHealthResponse;
import com.example.historyrag.feature.rag.dto.RagIngestRequest;
import com.example.historyrag.feature.rag.dto.RagIngestResponse;
import com.example.historyrag.feature.rag.dto.RagRetrieveRequest;
import com.example.historyrag.feature.rag.dto.RagRetrieveResponse;
import com.example.historyrag.infrastructure.feign.RagClientService;
import com.example.historyrag.infrastructure.feign.RagStreamEvent;
import java.util.List;
import java.util.function.Consumer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RagServiceImplTest {

    @Mock
    private RagClientService ragClientService;

    @InjectMocks
    private RagServiceImpl ragService;

    @Test
    void healthChatRetrieveIngestAndDeleteDelegateToClient() {
        RagChatRequest chatRequest = new RagChatRequest("Question", 5, false, List.of(), List.of(), 0.2);
        RagRetrieveRequest retrieveRequest = new RagRetrieveRequest("Question", 5, List.of(), List.of());
        RagIngestRequest ingestRequest = new RagIngestRequest(
                1L,
                "MANUAL_INPUT",
                "Manual",
                null,
                null,
                null,
                null,
                "Noi dung",
                null,
                null
        );
        RagHealthResponse healthResponse = new RagHealthResponse("ok", "rag-history");
        RagChatResponse chatResponse = new RagChatResponse("Answer", List.of(), true, false);
        RagRetrieveResponse retrieveResponse = new RagRetrieveResponse("Question", 5, List.of());
        RagIngestResponse ingestResponse = new RagIngestResponse(1L, "COMPLETED", "history", "embed", List.of());
        RagDeleteResponse deleteResponse = new RagDeleteResponse("deleted", 1L);
        when(ragClientService.getHealth("00-trace")).thenReturn(healthResponse);
        when(ragClientService.chat(chatRequest, "00-trace")).thenReturn(chatResponse);
        when(ragClientService.retrieve(retrieveRequest, "00-trace")).thenReturn(retrieveResponse);
        when(ragClientService.ingest(ingestRequest, "00-trace")).thenReturn(ingestResponse);
        when(ragClientService.deleteSource(1L, "00-trace")).thenReturn(deleteResponse);

        assertThat(ragService.getHealth("00-trace")).isEqualTo(healthResponse);
        assertThat(ragService.chat(chatRequest, "00-trace")).isEqualTo(chatResponse);
        assertThat(ragService.retrieve(retrieveRequest, "00-trace")).isEqualTo(retrieveResponse);
        assertThat(ragService.ingest(ingestRequest, "00-trace")).isEqualTo(ingestResponse);
        assertThat(ragService.deleteSource(1L, "00-trace")).isEqualTo(deleteResponse);
    }

    @Test
    void streamChatSubscribesToRagClientWithRequestAndTraceparent() {
        RagChatRequest request = new RagChatRequest(
                "Nhà Trần thành lập năm nào?",
                5,
                false,
                List.of(2L),
                List.of(7L),
                0.2
        );
        // streamChat trả void (Feign callback-based) → không stub, chỉ verify được gọi đúng tham số
        SseEmitter emitter = ragService.streamChat(request, "00-trace");

        assertThat(emitter).isNotNull();
        verify(ragClientService).streamChat(
                eq(request),
                eq("00-trace"),
                any(),
                any(),
                any()
        );
    }

    @Test
    void eventAndErrorCallbacksAreSafeToInvokeBeforeResponseIsCommitted() {
        RagChatRequest request = new RagChatRequest("Question", 5, false, List.of(), List.of(), 0.2);

        // Gọi trước (streamChat void), rồi capture callback đã truyền vào để invoke thủ công
        SseEmitter emitter = ragService.streamChat(request, null);

        ArgumentCaptor<Consumer<RagStreamEvent>> eventCaptor = ArgumentCaptor.forClass(Consumer.class);
        ArgumentCaptor<Consumer<Throwable>> errorCaptor = ArgumentCaptor.forClass(Consumer.class);
        verify(ragClientService).streamChat(
                eq(request),
                isNull(),
                eventCaptor.capture(),
                errorCaptor.capture(),
                any()
        );

        eventCaptor.getValue().accept(new RagStreamEvent("chat.delta", "{\"text\":\"xin chao\"}"));
        errorCaptor.getValue().accept(new RuntimeException("RAG failed"));
        emitter.complete();

        assertThat(emitter).isNotNull();
    }
}
