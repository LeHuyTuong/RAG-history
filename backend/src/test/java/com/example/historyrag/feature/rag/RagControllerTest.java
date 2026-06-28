package com.example.historyrag.feature.rag;

import com.example.historyrag.feature.rag.dto.RagChatRequest;
import com.example.historyrag.feature.rag.dto.RagChatResponse;
import com.example.historyrag.feature.rag.dto.RagDeleteResponse;
import com.example.historyrag.feature.rag.dto.RagHealthResponse;
import com.example.historyrag.feature.rag.dto.RagIngestRequest;
import com.example.historyrag.feature.rag.dto.RagIngestResponse;
import com.example.historyrag.feature.rag.dto.RagRetrieveRequest;
import com.example.historyrag.feature.rag.dto.RagRetrieveResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RagControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private RagService ragService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders
                .standaloneSetup(new RagController(ragService))
                .setValidator(validator)
                .build();
    }

    @Test
    void getHealthReturnsApiResponseWrapper() throws Exception {
        when(ragService.getHealth("00-trace")).thenReturn(new RagHealthResponse("ok", "rag-history"));

        mockMvc.perform(get("/api/v1/rag/health").header("traceparent", "00-trace"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.status").value("ok"))
                .andExpect(jsonPath("$.data.service").value("rag-history"));
    }

    @Test
    void chatReturnsApiResponseWrapper() throws Exception {
        RagChatRequest request = new RagChatRequest("Question", 5, false, List.of(), List.of(), 0.2);
        when(ragService.chat(eq(request), eq(null)))
                .thenReturn(new RagChatResponse("Answer", List.of(), true, false, List.of()));

        mockMvc.perform(post("/api/v1/rag/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.answer").value("Answer"))
                .andExpect(jsonPath("$.data.usedVector").value(true));
    }

    @Test
    void retrieveReturnsApiResponseWrapper() throws Exception {
        RagRetrieveRequest request = new RagRetrieveRequest("Question", 3, List.of(), List.of());
        when(ragService.retrieve(eq(request), eq(null)))
                .thenReturn(new RagRetrieveResponse("Question", 3, List.of()));

        mockMvc.perform(post("/api/v1/rag/retrieve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.question").value("Question"))
                .andExpect(jsonPath("$.data.topK").value(3));
    }

    @Test
    void ingestReturnsApiResponseWrapper() throws Exception {
        RagIngestRequest request = new RagIngestRequest(
                7L,
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
        when(ragService.ingest(eq(request), eq(null)))
                .thenReturn(new RagIngestResponse(7L, "COMPLETED", "history", "embed", List.of()));

        mockMvc.perform(post("/api/v1/rag/ingest")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sourceId").value(7))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));
    }

    @Test
    void ingestRejectsMissingContentInput() throws Exception {
        RagIngestRequest request = new RagIngestRequest(
                7L,
                "MANUAL_INPUT",
                "Manual",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        mockMvc.perform(post("/api/v1/rag/ingest")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteSourceReturnsApiResponseWrapper() throws Exception {
        when(ragService.deleteSource(7L, "00-trace")).thenReturn(new RagDeleteResponse("deleted", 7L));

        mockMvc.perform(delete("/api/v1/rag/sources/7").header("traceparent", "00-trace"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("deleted"))
                .andExpect(jsonPath("$.data.sourceId").value(7));
    }
}
