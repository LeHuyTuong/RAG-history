package com.example.historyrag.feature.person;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.GlobalExceptionHandler;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.person.dto.PersonRequest;
import com.example.historyrag.feature.person.dto.PersonResponse;
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
class PersonControllerTest {

    @Mock
    private PersonService personService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        PersonController controller = new PersonController(personService);
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setValidator(validator)
                .build();
    }

    @Test
    @DisplayName("Should return paginated persons wrapped in ApiResponse")
    void filter_existingPersons_returnsResultPagination() throws Exception {
        ResultPaginationDTO result = new ResultPaginationDTO(
                new ResultPaginationDTO.Meta(1, 10, 1, 1),
                List.of(personResponse())
        );
        when(personService.getAllPersons(eq("ngo"), any(Pageable.class))).thenReturn(result);

        mockMvc.perform(get("/api/v1/admin/persons")
                        .param("keyword", "ngo")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Lấy danh sách nhân vật thành công"))
                .andExpect(jsonPath("$.data.meta.page").value(1))
                .andExpect(jsonPath("$.data.result[0].slug").value("ngo-quyen"));
    }

    @Test
    @DisplayName("Should return person detail wrapped in ApiResponse")
    void getById_existingPerson_returnsPersonResponse() throws Exception {
        when(personService.getById(1L)).thenReturn(personResponse());

        mockMvc.perform(get("/api/v1/admin/persons/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Lấy thông tin nhân vật thành công"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.alias").value("Tiền Ngô Vương"));
    }

    @Test
    @DisplayName("Should return not found when person does not exist")
    void getById_missingPerson_returnsNotFound() throws Exception {
        when(personService.getById(404L)).thenThrow(new ResourceNotFoundException("Nhân vật", "id", 404L));

        mockMvc.perform(get("/api/v1/admin/persons/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.statusCode").value(404))
                .andExpect(jsonPath("$.message", containsString("Nhân vật")));
    }

    @Test
    @DisplayName("Should create person and return Location header")
    void create_validRequest_returnsCreated() throws Exception {
        when(personService.createPerson(any(PersonRequest.class))).thenReturn(personResponse());

        mockMvc.perform(post("/api/v1/admin/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Ngô Quyền",
                                  "slug":"ngo-quyen",
                                  "alias":"Tiền Ngô Vương",
                                  "birthDate":"0898-01-01",
                                  "deathDate":"0944-01-01",
                                  "biography":"Vị vua đặt nền móng cho nền độc lập lâu dài"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/admin/persons/1"))
                .andExpect(jsonPath("$.statusCode").value(201))
                .andExpect(jsonPath("$.message").value("Tạo nhân vật thành công"))
                .andExpect(jsonPath("$.data.slug").value("ngo-quyen"));
    }

    @Test
    @DisplayName("Should return validation error when create request is invalid")
    void create_invalidRequest_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/admin/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"","slug":"Invalid Slug","birthDate":"0944-01-01","deathDate":"0898-01-01"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.details", hasItem(containsString("name"))));

        verify(personService, never()).createPerson(any());
    }

    @Test
    @DisplayName("Should return conflict when create slug already exists")
    void create_duplicateSlug_returnsConflict() throws Exception {
        when(personService.createPerson(any(PersonRequest.class)))
                .thenThrow(new DuplicateResourceException("Nhân vật", "slug", "ngo-quyen"));

        mockMvc.perform(post("/api/v1/admin/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Ngô Quyền","slug":"ngo-quyen"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.statusCode").value(409))
                .andExpect(jsonPath("$.message", containsString("slug")));
    }

    @Test
    @DisplayName("Should update person by path id")
    void update_validRequest_returnsPersonResponse() throws Exception {
        when(personService.updatePerson(eq(1L), any(PersonRequest.class))).thenReturn(personResponse());

        mockMvc.perform(put("/api/v1/admin/persons/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Ngô Quyền",
                                  "slug":"ngo-quyen",
                                  "alias":"Tiền Ngô Vương",
                                  "birthDate":"0898-01-01",
                                  "deathDate":"0944-01-01"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Cập nhật nhân vật thành công"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("Should delete person by id")
    void delete_existingPerson_returnsSuccess() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/persons/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Xóa nhân vật thành công"));

        verify(personService).deletePerson(1L);
    }

    private PersonResponse personResponse() {
        return new PersonResponse(
                1L,
                "Ngô Quyền",
                "ngo-quyen",
                "Tiền Ngô Vương",
                LocalDate.of(898, 1, 1),
                LocalDate.of(944, 1, 1),
                "Vị vua đặt nền móng cho nền độc lập lâu dài",
                Instant.parse("2026-06-16T00:00:00Z"),
                Instant.parse("2026-06-16T01:00:00Z")
        );
    }
}
