package com.example.historyrag.feature.event;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.GlobalExceptionHandler;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.event.dto.CreateEventRequest;
import com.example.historyrag.feature.event.dto.EventFilterRequest;
import com.example.historyrag.feature.event.dto.EventResponse;
import com.example.historyrag.feature.event.dto.UpdateEventRequest;
import com.example.historyrag.feature.location.LocationType;
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
import java.time.LocalDate;
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
class EventControllerTest {

    @Mock
    private EventService eventService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        EventController controller = new EventController(eventService);
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setValidator(validator)
                .build();
    }

    @Test
    @DisplayName("Should return paginated events wrapped in ApiResponse")
    void filter_existingEvents_returnsResultPagination() throws Exception {
        ResultPaginationDTO result = new ResultPaginationDTO(
                new ResultPaginationDTO.Meta(1, 10, 1, 1),
                List.of(eventResponse())
        );
        when(eventService.filter(any(EventFilterRequest.class), any(Pageable.class))).thenReturn(result);

        mockMvc.perform(get("/api/v1/admin/events")
                        .param("keyword", "bach")
                        .param("periodId", "1")
                        .param("locationId", "2")
                        .param("certaintyLevel", "CERTAIN")
                        .param("startYearFrom", "1200")
                        .param("startYearTo", "1300")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Lấy danh sách sự kiện thành công"))
                .andExpect(jsonPath("$.data.meta.page").value(1))
                .andExpect(jsonPath("$.data.result[0].slug").value("chien-thang-bach-dang"));
    }

    @Test
    @DisplayName("Should return event detail wrapped in ApiResponse")
    void getById_existingEvent_returnsEventResponse() throws Exception {
        when(eventService.getById(1L)).thenReturn(eventResponse());

        mockMvc.perform(get("/api/v1/admin/events/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Lấy thông tin sự kiện thành công"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.period.slug").value("nha-tran"))
                .andExpect(jsonPath("$.data.locationRelations[0].relationType").value("BATTLEFIELD"));
    }

    @Test
    @DisplayName("Should return not found when event does not exist")
    void getById_missingEvent_returnsNotFound() throws Exception {
        when(eventService.getById(404L)).thenThrow(new ResourceNotFoundException("Sự kiện", "id", 404L));

        mockMvc.perform(get("/api/v1/admin/events/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.statusCode").value(404))
                .andExpect(jsonPath("$.message", containsString("Sự kiện")));
    }

    @Test
    @DisplayName("Should create event and return Location header")
    void create_validRequest_returnsCreated() throws Exception {
        when(eventService.create(any(CreateEventRequest.class))).thenReturn(eventResponse());

        mockMvc.perform(post("/api/v1/admin/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Chiến thắng Bạch Đằng",
                                  "slug":"chien-thang-bach-dang",
                                  "description":"Trận thủy chiến lịch sử",
                                  "periodId":1,
                                  "startYear":1288,
                                  "endYear":1288,
                                  "startDate":"1288-01-01",
                                  "endDate":"1288-12-31",
                                  "certaintyLevel":"CERTAIN",
                                  "locationRelations":[{"locationId":2,"relationType":"BATTLEFIELD"}]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/admin/events/1"))
                .andExpect(jsonPath("$.statusCode").value(201))
                .andExpect(jsonPath("$.message").value("Tạo sự kiện thành công"))
                .andExpect(jsonPath("$.data.slug").value("chien-thang-bach-dang"));
    }

    @Test
    @DisplayName("Should return validation error when create request is invalid")
    void create_invalidRequest_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/admin/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"","slug":"Invalid Slug","locationRelations":[{"relationType":"bad"}]}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.details", hasItem(containsString("name"))));

        verify(eventService, never()).create(any());
    }

    @Test
    @DisplayName("Should return conflict when create slug already exists")
    void create_duplicateSlug_returnsConflict() throws Exception {
        when(eventService.create(any(CreateEventRequest.class)))
                .thenThrow(new DuplicateResourceException("Sự kiện", "slug", "chien-thang-bach-dang"));

        mockMvc.perform(post("/api/v1/admin/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Chiến thắng Bạch Đằng","slug":"chien-thang-bach-dang"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.statusCode").value(409))
                .andExpect(jsonPath("$.message", containsString("slug")));
    }

    @Test
    @DisplayName("Should return validation error when relation type is not enum-like")
    void create_invalidRelationType_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/admin/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Chiến thắng Bạch Đằng",
                                  "slug":"chien-thang-bach-dang",
                                  "locationRelations":[{"locationId":2,"relationType":"BASE_1"}]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.details", hasItem(containsString("Relation type must be a valid enum-like value"))));

        verify(eventService, never()).create(any());
    }

    @Test
    @DisplayName("Should update event by path id")
    void update_validRequest_returnsEventResponse() throws Exception {
        when(eventService.update(eq(1L), any(UpdateEventRequest.class))).thenReturn(eventResponse());

        mockMvc.perform(put("/api/v1/admin/events/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Chiến thắng Bạch Đằng",
                                  "slug":"chien-thang-bach-dang",
                                  "description":"Trận thủy chiến lịch sử",
                                  "periodId":1,
                                  "startYear":1288,
                                  "endYear":1288,
                                  "certaintyLevel":"CERTAIN",
                                  "locationRelations":[{"locationId":2,"relationType":"BATTLEFIELD"}]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Cập nhật sự kiện thành công"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("Should delete event by id")
    void delete_existingEvent_returnsSuccess() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/events/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Xóa sự kiện thành công"));

        verify(eventService).delete(1L);
    }

    private EventResponse eventResponse() {
        return new EventResponse(
                1L,
                "Chiến thắng Bạch Đằng",
                "chien-thang-bach-dang",
                "Trận thủy chiến lịch sử",
                new EventResponse.PeriodSummary(1L, "Nhà Trần", "nha-tran"),
                1288,
                1288,
                LocalDate.parse("1288-01-01"),
                LocalDate.parse("1288-12-31"),
                EventCertaintyLevel.CERTAIN,
                List.of(new EventResponse.LocationRelationResponse(
                        2L,
                        "Bạch Đằng",
                        "bach-dang",
                        LocationType.BATTLEFIELD,
                        "BATTLEFIELD"
                )),
                Instant.parse("2026-06-16T00:00:00Z"),
                Instant.parse("2026-06-16T01:00:00Z")
        );
    }
}
