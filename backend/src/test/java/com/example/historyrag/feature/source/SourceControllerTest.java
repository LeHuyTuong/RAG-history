package com.example.historyrag.feature.source;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.GlobalExceptionHandler;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.source.dto.CreateSourceRequest;
import com.example.historyrag.feature.source.dto.SourceFilterRequest;
import com.example.historyrag.feature.source.dto.SourceResponse;
import com.example.historyrag.feature.source.dto.UpdateSourceRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SourceControllerTest {

    @Mock
    private SourceService sourceService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        SourceController controller = new SourceController(sourceService);
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setValidator(validator)
                .build();
    }

    @Test
    @DisplayName("Should return paginated sources wrapped in ApiResponse")
    void filter_existingSources_returnsResultPagination() throws Exception {
        ResultPaginationDTO result = new ResultPaginationDTO(
                new ResultPaginationDTO.Meta(1, 10, 1, 1),
                List.of(sourceResponse())
        );
        when(sourceService.filter(any(SourceFilterRequest.class), any(Pageable.class))).thenReturn(result);

        mockMvc.perform(get("/api/v1/admin/sources")
                        .param("keyword", "đại việt")
                        .param("sourceType", "BOOK")
                        .param("reliabilityLevel", "HIGH")
                        .param("publicationYear", "1697")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Lấy danh sách nguồn tư liệu thành công"))
                .andExpect(jsonPath("$.data.meta.page").value(1))
                .andExpect(jsonPath("$.data.result[0].sourceType").value("BOOK"));
    }

    @Test
    @DisplayName("Should return source detail wrapped in ApiResponse")
    void getById_existingSource_returnsSourceResponse() throws Exception {
        when(sourceService.getById(1L)).thenReturn(sourceResponse());

        mockMvc.perform(get("/api/v1/admin/sources/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Lấy thông tin nguồn tư liệu thành công"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.reliabilityLevel").value("HIGH"));
    }

    @Test
    @DisplayName("Should return not found when source does not exist")
    void getById_missingSource_returnsNotFound() throws Exception {
        when(sourceService.getById(404L)).thenThrow(new ResourceNotFoundException("Nguồn tư liệu", "id", 404L));

        mockMvc.perform(get("/api/v1/admin/sources/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.statusCode").value(404))
                .andExpect(jsonPath("$.message", containsString("Nguồn tư liệu")));
    }

    @Test
    @DisplayName("Should create source and return Location header")
    void create_validRequest_returnsCreated() throws Exception {
        when(sourceService.create(any(CreateSourceRequest.class))).thenReturn(sourceResponse());

        mockMvc.perform(post("/api/v1/admin/sources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Đại Việt sử ký toàn thư",
                                  "sourceType":"BOOK",
                                  "filePath":"/seed/sources/dai-viet-su-ky-toan-thu.pdf",
                                  "content":"Tư liệu lịch sử",
                                  "author":"Ngô Sĩ Liên",
                                  "publicationYear":1697,
                                  "reliabilityLevel":"HIGH"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/admin/sources/1"))
                .andExpect(jsonPath("$.statusCode").value(201))
                .andExpect(jsonPath("$.message").value("Tạo nguồn tư liệu thành công"))
                .andExpect(jsonPath("$.data.title").value("Đại Việt sử ký toàn thư"));
    }

    @Test
    @DisplayName("Should return validation error when create request is invalid")
    void create_invalidRequest_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/admin/sources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"","sourceUrl":"https://example.local/source"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.details", hasItem(containsString("title"))));

        verify(sourceService, never()).create(any());
    }

    @Test
    @DisplayName("Should update source by path id")
    void update_validRequest_returnsSourceResponse() throws Exception {
        when(sourceService.update(eq(1L), any(UpdateSourceRequest.class))).thenReturn(sourceResponse());

        mockMvc.perform(put("/api/v1/admin/sources/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Đại Việt sử ký toàn thư",
                                  "sourceType":"BOOK",
                                  "filePath":"/seed/sources/dai-viet-su-ky-toan-thu.pdf",
                                  "content":"Tư liệu lịch sử",
                                  "author":"Ngô Sĩ Liên",
                                  "publicationYear":1697,
                                  "reliabilityLevel":"HIGH"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Cập nhật nguồn tư liệu thành công"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("Should delete source by id")
    void delete_existingSource_returnsSuccess() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/sources/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Xóa nguồn tư liệu thành công"));

        verify(sourceService).delete(1L);
    }

    private SourceResponse sourceResponse() {
        return new SourceResponse(
                1L,
                "Đại Việt sử ký toàn thư",
                SourceType.BOOK,
                null,
                "/seed/sources/dai-viet-su-ky-toan-thu.pdf",
                "Tư liệu lịch sử",
                "Ngô Sĩ Liên",
                1697,
                ReliabilityLevel.HIGH,
                Instant.parse("2026-06-16T00:00:00Z"),
                Instant.parse("2026-06-16T01:00:00Z")
        );
    }
}
