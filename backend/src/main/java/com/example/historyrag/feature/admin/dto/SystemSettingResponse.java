package com.example.historyrag.feature.admin.dto;

import com.example.historyrag.feature.admin.SystemSetting;

import java.time.Instant;

public record SystemSettingResponse(
        Long id,
        String key,
        String value,
        String description,
        Instant updatedAt
) {

    public static SystemSettingResponse fromEntity(SystemSetting setting) {
        return new SystemSettingResponse(
                setting.getId(),
                setting.getSettingKey(),
                setting.getSettingValue(),
                setting.getDescription(),
                setting.getUpdatedAt()
        );
    }
}
