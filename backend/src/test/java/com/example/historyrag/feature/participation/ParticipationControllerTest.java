package com.example.historyrag.feature.participation;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.GlobalExceptionHandler;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.participation.dto.CreateParticipationRequest;
import com.example.historyrag.feature.participation.dto.ParticipationFilterRequest;
import com.example.historyrag.feature.participation.dto.ParticipationResponse;
import com.example.historyrag.feature.participation.dto.UpdateParticipationRequest;
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

import java.math.BigDecimal;
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
class ParticipationControllerTest {

    @Mock
    private ParticipationService participationService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ParticipationController controller = new ParticipationController(participationService);
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setValidator(validator)
                .build();
    }

    @Test
    @DisplayName("Should return paginated participations wrapped in ApiResponse")
    void filter_existingParticipations_returnsResultPagination() throws Exception {
        ResultPaginationDTO result = new ResultPaginationDTO(
                new ResultPaginationDTO.Meta(1, 10, 1, 1),
                List.of(participationResponse())
        );
        when(participationService.filter(any(ParticipationFilterRequest.class), any(Pageable.class))).thenReturn(result);

        mockMvc.perform(get("/api/v1/admin/participations")
                        .param("eventId", "1")
                        .param("personId", "2")
                        .param("role", "GENERAL")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Lấy danh sách tham gia sự kiện thành công"))
                .andExpect(jsonPath("$.data.meta.page").value(1))
                .andExpect(jsonPath("$.data.result[0].person.slug").value("tran-hung-dao"));
    }

    @Test
    @DisplayName("Should return participation detail wrapped in ApiResponse")
    void getById_existingParticipation_returnsParticipationResponse() throws Exception {
        when(participationService.getById(10L)).thenReturn(participationResponse());

        mockMvc.perform(get("/api/v1/admin/participations/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Lấy thông tin tham gia sự kiện thành công"))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.event.slug").value("khang-chien-mong-nguyen"));
    }

    @Test
    @DisplayName("Should return not found when participation does not exist")
    void getById_missingParticipation_returnsNotFound() throws Exception {
        when(participationService.getById(404L))
                .thenThrow(new ResourceNotFoundException("Tham gia sự kiện", "id", 404L));

        mockMvc.perform(get("/api/v1/admin/participations/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.statusCode").value(404))
                .andExpect(jsonPath("$.message", containsString("Tham gia sự kiện")));
    }

    @Test
    @DisplayName("Should create participation and return Location header")
    void create_validRequest_returnsCreated() throws Exception {
        when(participationService.create(any(CreateParticipationRequest.class))).thenReturn(participationResponse());

        mockMvc.perform(post("/api/v1/admin/participations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "eventId":1,
                                  "personId":2,
                                  "role":"GENERAL",
                                  "note":"Chỉ huy quân đội",
                                  "confidence":0.95
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/admin/participations/10"))
                .andExpect(jsonPath("$.statusCode").value(201))
                .andExpect(jsonPath("$.message").value("Tạo tham gia sự kiện thành công"))
                .andExpect(jsonPath("$.data.role").value("GENERAL"));
    }

    @Test
    @DisplayName("Should return validation error when create request is invalid")
    void create_invalidRequest_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/admin/participations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"role":"GENERAL","confidence":1.5}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.details", hasItem(containsString("eventId"))));

        verify(participationService, never()).create(any());
    }

    @Test
    @DisplayName("Should return conflict when create combination already exists")
    void create_duplicateCombination_returnsConflict() throws Exception {
        when(participationService.create(any(CreateParticipationRequest.class)))
                .thenThrow(new DuplicateResourceException("Tham gia sự kiện", "eventId, personId, role", "1, 2, GENERAL"));

        mockMvc.perform(post("/api/v1/admin/participations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"eventId":1,"personId":2,"role":"GENERAL","confidence":0.95}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.statusCode").value(409))
                .andExpect(jsonPath("$.message", containsString("eventId, personId, role")));
    }

    @Test
    @DisplayName("Should update participation by path id")
    void update_validRequest_returnsParticipationResponse() throws Exception {
        when(participationService.update(eq(10L), any(UpdateParticipationRequest.class)))
                .thenReturn(participationResponse());

        mockMvc.perform(put("/api/v1/admin/participations/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "eventId":1,
                                  "personId":2,
                                  "role":"GENERAL",
                                  "note":"Chỉ huy quân đội",
                                  "confidence":0.95
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Cập nhật tham gia sự kiện thành công"))
                .andExpect(jsonPath("$.data.id").value(10));
    }

    @Test
    @DisplayName("Should delete participation by id")
    void delete_existingParticipation_returnsSuccess() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/participations/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Xóa tham gia sự kiện thành công"));

        verify(participationService).delete(10L);
    }

    private ParticipationResponse participationResponse() {
        return new ParticipationResponse(
                10L,
                new ParticipationResponse.EventSummary(
                        1L,
                        "Kháng chiến Mông Nguyên",
                        "khang-chien-mong-nguyen"),
                new ParticipationResponse.PersonSummary(
                        2L,
                        "Trần Hưng Đạo",
                        "tran-hung-dao"),
                ParticipationRole.GENERAL,
                "Chỉ huy quân đội",
                new BigDecimal("0.95"),
                Instant.parse("2026-06-16T00:00:00Z"),
                Instant.parse("2026-06-16T01:00:00Z")
        );
    }
}
