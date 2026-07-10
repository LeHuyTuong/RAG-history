package com.example.historyrag.feature.admin;

import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.admin.dto.SystemSettingRequest;
import com.example.historyrag.feature.admin.dto.SystemSettingResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemSettingServiceImplTest {

    @Mock
    private SystemSettingRepository systemSettingRepository;

    private SystemSettingServiceImpl systemSettingService;

    @BeforeEach
    void setUp() {
        systemSettingService = new SystemSettingServiceImpl(systemSettingRepository);
    }

    @Test
    @DisplayName("Should return all system settings sorted by key")
    void getAll_existingSettings_returnsSortedSettings() {
        when(systemSettingRepository.findBySettingKeyInOrderBySettingKeyAsc(any()))
                .thenReturn(List.of(setting("rag.llm_model", "gemini-2.0-flash")));

        List<SystemSettingResponse> result = systemSettingService.getAll();

        assertEquals(1, result.size());
        assertEquals("rag.llm_model", result.getFirst().key());
    }

    @Test
    @DisplayName("Should return system setting by key")
    void getByKey_existingSetting_returnsSettingResponse() {
        when(systemSettingRepository.findBySettingKey("ui.logo_url"))
                .thenReturn(Optional.of(setting("ui.logo_url", "/images/logo.png")));

        SystemSettingResponse response = systemSettingService.getByKey("ui.logo_url");

        assertEquals("ui.logo_url", response.key());
        assertEquals("/images/logo.png", response.value());
    }

    @Test
    @DisplayName("Should reject get by key when key is not managed")
    void getByKey_unsupportedSetting_throwsInvalidRequestException() {
        assertThrows(InvalidRequestException.class, () -> systemSettingService.getByKey("missing.key"));
    }

    @Test
    @DisplayName("Should update existing system setting")
    void upsert_existingSetting_returnsUpdatedSettingResponse() {
        SystemSetting setting = setting("rag.llm_model", "gemini-2.0-flash");
        when(systemSettingRepository.findBySettingKey("rag.llm_model")).thenReturn(Optional.of(setting));
        when(systemSettingRepository.save(setting)).thenReturn(setting);

        SystemSettingResponse response = systemSettingService.upsert(
                new SystemSettingRequest("rag.llm_model", "gemini-2.5-flash", "Model sinh câu trả lời"));

        assertEquals("gemini-2.5-flash", response.value());
        assertEquals("Model sinh câu trả lời", response.description());
    }

    @Test
    @DisplayName("Should create system setting when key does not exist")
    void upsert_newSetting_returnsCreatedSettingResponse() {
        when(systemSettingRepository.findBySettingKey("ui.background_url")).thenReturn(Optional.empty());
        when(systemSettingRepository.save(any(SystemSetting.class))).thenAnswer(invocation -> {
            SystemSetting saved = invocation.getArgument(0);
            saved.setId(2L);
            saved.setUpdatedAt(Instant.parse("2026-07-03T00:00:00Z"));
            return saved;
        });

        SystemSettingResponse response = systemSettingService.upsert(
                new SystemSettingRequest("ui.background_url", "/images/bg.jpg", "Ảnh nền"));

        assertEquals(2L, response.id());
        assertEquals("ui.background_url", response.key());
        assertEquals("/images/bg.jpg", response.value());
    }

    @Test
    @DisplayName("Should reject upsert when key is not managed")
    void upsert_unsupportedSetting_throwsInvalidRequestException() {
        SystemSettingRequest request = new SystemSettingRequest("rag.temperature", "0.7", "Không quản lý ở UI");

        assertThrows(InvalidRequestException.class, () -> systemSettingService.upsert(request));
    }

    private SystemSetting setting(String key, String value) {
        SystemSetting setting = new SystemSetting();
        setting.setId(1L);
        setting.setSettingKey(key);
        setting.setSettingValue(value);
        setting.setDescription("Mô tả");
        setting.setUpdatedAt(Instant.parse("2026-07-03T00:00:00Z"));
        return setting;
    }
}
