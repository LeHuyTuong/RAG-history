package com.example.historyrag.feature.admin;

import com.example.historyrag.exception.GlobalExceptionHandler;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.admin.dto.SystemSettingRequest;
import com.example.historyrag.feature.admin.dto.SystemSettingResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SystemSettingControllerTest {

    @Mock
    private SystemSettingService systemSettingService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        SystemSettingController controller = new SystemSettingController(systemSettingService);
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    @DisplayName("Should return all system settings")
    void getAll_existingSettings_returnsSettingList() throws Exception {
        when(systemSettingService.getAll()).thenReturn(List.of(response()));

        mockMvc.perform(get("/api/v1/admin/settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Lấy cấu hình hệ thống thành công"))
                .andExpect(jsonPath("$.data[0].key").value("rag.llm_model"));
    }

    @Test
    @DisplayName("Should return system setting by key")
    void getByKey_existingSetting_returnsSettingResponse() throws Exception {
        when(systemSettingService.getByKey("rag.llm_model")).thenReturn(response());

        mockMvc.perform(get("/api/v1/admin/settings/rag.llm_model"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.value").value("gemini-2.0-flash"));
    }

    @Test
    @DisplayName("Should return not found when system setting does not exist")
    void getByKey_missingSetting_returnsNotFound() throws Exception {
        when(systemSettingService.getByKey("missing.key"))
                .thenThrow(new ResourceNotFoundException("Cấu hình hệ thống", "key", "missing.key"));

        mockMvc.perform(get("/api/v1/admin/settings/missing.key"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Cấu hình hệ thống")));
    }

    @Test
    @DisplayName("Should upsert system setting by path key")
    void upsert_validRequest_returnsSettingResponse() throws Exception {
        when(systemSettingService.upsert(any(SystemSettingRequest.class))).thenReturn(response());

        mockMvc.perform(put("/api/v1/admin/settings/rag.llm_model")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "key":"rag.llm_model",
                                  "value":"gemini-2.0-flash",
                                  "description":"Model sinh câu trả lời"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Lưu cấu hình hệ thống thành công"))
                .andExpect(jsonPath("$.data.key").value("rag.llm_model"));
    }

    @Test
    @DisplayName("Should return validation error when key is invalid")
    void upsert_invalidRequest_returnsBadRequest() throws Exception {
        mockMvc.perform(put("/api/v1/admin/settings/invalid-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"key":"Invalid Key","value":"value"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details", hasItem(containsString("key"))));

        verify(systemSettingService, never()).upsert(any());
    }

    private SystemSettingResponse response() {
        return new SystemSettingResponse(
                1L,
                "rag.llm_model",
                "gemini-2.0-flash",
                "Model sinh câu trả lời",
                Instant.parse("2026-07-03T00:00:00Z")
        );
    }
}
