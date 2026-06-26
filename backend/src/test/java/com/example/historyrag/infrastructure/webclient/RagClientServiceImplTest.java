package com.example.historyrag.infrastructure.webclient;

import com.example.historyrag.feature.rag.dto.RagChatRequest;
import com.example.historyrag.feature.rag.dto.RagChatResponse;
import com.example.historyrag.feature.rag.dto.RagDeleteResponse;
import com.example.historyrag.feature.rag.dto.RagHealthResponse;
import com.example.historyrag.feature.rag.dto.RagIngestRequest;
import com.example.historyrag.feature.rag.dto.RagIngestResponse;
import com.example.historyrag.feature.rag.dto.RagRetrieveRequest;
import com.example.historyrag.feature.rag.dto.RagRetrieveResponse;
import com.example.historyrag.infrastructure.feign.RagClientService;
import com.example.historyrag.infrastructure.feign.RagFeignClient;
import com.example.historyrag.infrastructure.feign.RagFeignClientAdapter;
import com.example.historyrag.infrastructure.feign.RagStreamEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import feign.Feign;
import feign.Request;
import feign.jackson.JacksonDecoder;
import feign.jackson.JacksonEncoder;
import feign.okhttp.OkHttpClient;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RagClientServiceImplTest {

    private HttpServer server;
    private String baseUrl;

    @BeforeEach
    void startServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        baseUrl = "http://localhost:" + server.getAddress().getPort();
    }

    @AfterEach
    void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void getHealthCallsRagHealthEndpointWithTraceparent() throws Exception {
        AtomicReference<String> traceparent = new AtomicReference<>();
        server.createContext("/rag/health", exchange -> {
            traceparent.set(exchange.getRequestHeaders().getFirst("traceparent"));
            sendJson(exchange, 200, "{\"status\":\"ok\",\"service\":\"rag-history\"}");
        });
        server.start();
        RagClientService service = newService();

        RagHealthResponse response = service.getHealth("00-trace");

        assertThat(response.status()).isEqualTo("ok");
        assertThat(response.service()).isEqualTo("rag-history");
        assertThat(traceparent.get()).isEqualTo("00-trace");
    }

    @Test
    void chatPostsJsonRequestAndReadsAnswerContract() throws Exception {
        AtomicReference<String> requestBody = new AtomicReference<>();
        server.createContext("/rag/chat", exchange -> {
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            sendJson(exchange, 200, """
                    {
                      "answer": "Nhà Trần thành lập năm 1225 [C1].",
                      "citations": [
                        {
                          "sourceType": "DOCUMENT",
                          "sourceId": 2,
                          "documentId": 20,
                          "title": "Tập 2",
                          "pageNumber": 105,
                          "chunkIndex": 9,
                          "score": 0.81
                        }
                      ],
                      "usedVector": true,
                      "usedGraph": false
                    }
                    """);
        });
        server.start();
        RagClientService service = newService();

        RagChatResponse response = service.chat(
                new RagChatRequest("Nhà Trần thành lập năm nào?", 5, false, List.of(2L), List.of(7L), 0.2),
                null
        );

        assertThat(requestBody.get()).contains("\"sourceIds\":[2]");
        assertThat(response.answer()).contains("1225");
        assertThat(response.citations()).hasSize(1);
        assertThat(response.citations().getFirst().documentId()).isEqualTo(20L);
        assertThat(response.usedVector()).isTrue();
    }

    @Test
    void retrievePostsDebugRequestAndReadsHits() throws Exception {
        AtomicReference<String> requestBody = new AtomicReference<>();
        server.createContext("/rag/retrieve", exchange -> {
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            sendJson(exchange, 200, """
                    {
                      "question": "Nhà Trần thành lập năm nào?",
                      "topK": 3,
                      "hits": [
                        {
                          "sourceType": "DOCUMENT",
                          "sourceId": 2,
                          "documentId": 20,
                          "title": "Tập 2",
                          "pageNumber": 105,
                          "chunkIndex": 9,
                          "score": 0.81,
                          "chunkText": "Nhà Trần thành lập năm 1225."
                        }
                      ]
                    }
                    """);
        });
        server.start();
        RagClientService service = newService();

        RagRetrieveResponse response = service.retrieve(
                new RagRetrieveRequest("Nhà Trần thành lập năm nào?", 3, List.of(2L), List.of()),
                null
        );

        assertThat(requestBody.get()).contains("\"topK\":3");
        assertThat(response.topK()).isEqualTo(3);
        assertThat(response.hits()).hasSize(1);
        assertThat(response.hits().getFirst().chunkText()).contains("1225");
    }

    @Test
    void ingestPostsSourcePayloadAndReadsChunkResponse() throws Exception {
        AtomicReference<String> requestBody = new AtomicReference<>();
        server.createContext("/rag/ingest", exchange -> {
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            sendJson(exchange, 200, """
                    {
                      "sourceId": 7,
                      "status": "COMPLETED",
                      "collection": "history_chunks",
                      "embeddingModel": "gemini-embedding-001",
                      "chunks": [
                        {"chunkIndex": 0, "qdrantPointId": "point-1", "contentHash": "hash-1"}
                      ]
                    }
                    """);
        });
        server.start();
        RagClientService service = newService();

        RagIngestResponse response = service.ingest(
                new RagIngestRequest(7L, "MANUAL_INPUT", "Manual", null, null, null, null, "Noi dung", null, null),
                "00-trace"
        );

        assertThat(requestBody.get()).contains("\"sourceId\":7");
        assertThat(requestBody.get()).contains("\"tagIds\":[]");
        assertThat(response.status()).isEqualTo("COMPLETED");
        assertThat(response.chunks()).hasSize(1);
    }

    @Test
    void deleteSourceCallsFastApiDeleteEndpoint() throws Exception {
        AtomicReference<String> query = new AtomicReference<>();
        server.createContext("/rag/delete", exchange -> {
            query.set(exchange.getRequestURI().getQuery());
            sendJson(exchange, 200, "{\"status\":\"deleted\",\"sourceId\":7}");
        });
        server.start();
        RagClientService service = newService();

        RagDeleteResponse response = service.deleteSource(7L, null);

        assertThat(query.get()).isEqualTo("sourceId=7");
        assertThat(response.status()).isEqualTo("deleted");
        assertThat(response.sourceId()).isEqualTo(7L);
    }

    @Test
    void streamChatPostsRequestWithTraceparentAndMapsServerSentEvents() throws Exception {
        AtomicReference<String> traceparent = new AtomicReference<>();
        AtomicReference<String> requestBody = new AtomicReference<>();
        server.createContext("/rag/chat/stream", exchange -> {
            traceparent.set(exchange.getRequestHeaders().getFirst("traceparent"));
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            sendSse(exchange, 200, """
                    event: chat.delta
                    data: {"text":"Nhà Trần"}

                    event: chat.completed
                    data: {"usedVector":true,"usedGraph":false}

                    """);
        });
        server.start();
        RagClientService service = newService();
        RagChatRequest request = new RagChatRequest("Nhà Trần thành lập năm nào?", 5, false, List.of(), List.of(), 0.2);
        List<RagStreamEvent> events = new CopyOnWriteArrayList<>();
        CountDownLatch completed = new CountDownLatch(1);
        AtomicReference<Throwable> error = new AtomicReference<>();

        service.streamChat(request, "00-trace", events::add, error::set, completed::countDown);

        assertThat(completed.await(5, TimeUnit.SECONDS)).isTrue();
        assertThat(error.get()).isNull();
        assertThat(traceparent.get()).isEqualTo("00-trace");
        assertThat(requestBody.get()).contains("\"question\":\"Nhà Trần thành lập năm nào?\"");
        assertThat(events)
                .extracting(RagStreamEvent::name)
                .containsExactly("chat.delta", "chat.completed");
        assertThat(events.getFirst().data()).isEqualTo("{\"text\":\"Nhà Trần\"}");
        assertThat(events.get(1).data()).isEqualTo("{\"usedVector\":true,\"usedGraph\":false}");
    }

    @Test
    void streamChatDefaultsMissingEventNameAndData() throws Exception {
        server.createContext("/rag/chat/stream", exchange -> sendSse(exchange, 200, "data:\n\n"));
        server.start();
        RagClientService service = newService();
        List<RagStreamEvent> events = new CopyOnWriteArrayList<>();
        CountDownLatch completed = new CountDownLatch(1);

        service.streamChat(
                new RagChatRequest("Question", null, false, List.of(), List.of(), 0.2),
                null,
                events::add,
                throwable -> { },
                completed::countDown
        );

        assertThat(completed.await(5, TimeUnit.SECONDS)).isTrue();
        assertThat(events).hasSize(1);
        assertThat(events.getFirst().name()).isEqualTo("message");
        assertThat(events.getFirst().data()).isEqualTo("{}");
    }

    private static void sendSse(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "text/event-stream; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private RagClientService newService() {
        ObjectMapper mapper = new ObjectMapper()
                .configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        RagFeignClient feignClient = Feign.builder()
                .client(new OkHttpClient())
                .encoder(new JacksonEncoder(mapper))
                .decoder(new JacksonDecoder(mapper))
                .requestInterceptor(new com.example.historyrag.infrastructure.feign.TraceparentInterceptor())
                .options(new Request.Options(5, TimeUnit.SECONDS, 5, TimeUnit.SECONDS, true))
                .target(RagFeignClient.class, baseUrl);
        return new RagFeignClientAdapter(feignClient);
    }

    private static void sendJson(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
