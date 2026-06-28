package com.example.historyrag.feature.location;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.GlobalExceptionHandler;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.location.dto.CreateLocationRequest;
import com.example.historyrag.feature.location.dto.LocationFilterRequest;
import com.example.historyrag.feature.location.dto.LocationResponse;
import com.example.historyrag.feature.location.dto.UpdateLocationRequest;
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
class LocationControllerTest {

    @Mock
    private LocationService locationService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocationController controller = new LocationController(locationService);
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setValidator(validator)
                .build();
    }

    @Test
    @DisplayName("Should return paginated locations wrapped in ApiResponse")
    void filter_existingLocations_returnsResultPagination() throws Exception {
        ResultPaginationDTO result = new ResultPaginationDTO(
                new ResultPaginationDTO.Meta(1, 10, 1, 1),
                List.of(locationResponse())
        );
        when(locationService.filter(any(LocationFilterRequest.class), any(Pageable.class))).thenReturn(result);

        mockMvc.perform(get("/api/v1/admin/locations")
                        .param("keyword", "co")
                        .param("locationType", "CAPITAL")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Lấy danh sách địa danh thành công"))
                .andExpect(jsonPath("$.data.meta.page").value(1))
                .andExpect(jsonPath("$.data.result[0].slug").value("co-loa"));
    }

    @Test
    @DisplayName("Should return location detail wrapped in ApiResponse")
    void getById_existingLocation_returnsLocationResponse() throws Exception {
        when(locationService.getById(1L)).thenReturn(locationResponse());

        mockMvc.perform(get("/api/v1/admin/locations/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Lấy thông tin địa danh thành công"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.locationType").value("CAPITAL"));
    }

    @Test
    @DisplayName("Should return not found when location does not exist")
    void getById_missingLocation_returnsNotFound() throws Exception {
        when(locationService.getById(404L)).thenThrow(new ResourceNotFoundException("Địa danh", "id", 404L));

        mockMvc.perform(get("/api/v1/admin/locations/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.statusCode").value(404))
                .andExpect(jsonPath("$.message", containsString("Địa danh")));
    }

    @Test
    @DisplayName("Should create location and return Location header")
    void create_validRequest_returnsCreated() throws Exception {
        when(locationService.create(any(CreateLocationRequest.class))).thenReturn(locationResponse());

        mockMvc.perform(post("/api/v1/admin/locations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Cổ Loa",
                                  "slug":"co-loa",
                                  "locationType":"CAPITAL",
                                  "latitude":21.116667,
                                  "longitude":105.866667,
                                  "description":"Kinh đô cổ"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/admin/locations/1"))
                .andExpect(jsonPath("$.statusCode").value(201))
                .andExpect(jsonPath("$.message").value("Tạo địa danh thành công"))
                .andExpect(jsonPath("$.data.slug").value("co-loa"));
    }

    @Test
    @DisplayName("Should return validation error when create request is invalid")
    void create_invalidRequest_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/admin/locations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"","slug":"Invalid Slug","latitude":91}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.details", hasItem(containsString("name"))));

        verify(locationService, never()).create(any());
    }

    @Test
    @DisplayName("Should return conflict when create slug already exists")
    void create_duplicateSlug_returnsConflict() throws Exception {
        when(locationService.create(any(CreateLocationRequest.class)))
                .thenThrow(new DuplicateResourceException("Địa danh", "slug", "co-loa"));

        mockMvc.perform(post("/api/v1/admin/locations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Cổ Loa","slug":"co-loa"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.statusCode").value(409))
                .andExpect(jsonPath("$.message", containsString("slug")));
    }

    @Test
    @DisplayName("Should update location by path id")
    void update_validRequest_returnsLocationResponse() throws Exception {
        when(locationService.update(eq(1L), any(UpdateLocationRequest.class))).thenReturn(locationResponse());

        mockMvc.perform(put("/api/v1/admin/locations/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Cổ Loa",
                                  "slug":"co-loa",
                                  "locationType":"CAPITAL",
                                  "latitude":21.116667,
                                  "longitude":105.866667
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Cập nhật địa danh thành công"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("Should delete location by id")
    void delete_existingLocation_returnsSuccess() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/locations/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Xóa địa danh thành công"));

        verify(locationService).delete(1L);
    }

    private LocationResponse locationResponse() {
        return new LocationResponse(
                1L,
                "Cổ Loa",
                "co-loa",
                LocationType.CAPITAL,
                new BigDecimal("21.116667"),
                new BigDecimal("105.866667"),
                "Kinh đô cổ",
                Instant.parse("2026-06-16T00:00:00Z"),
                Instant.parse("2026-06-16T01:00:00Z")
        );
    }
}
