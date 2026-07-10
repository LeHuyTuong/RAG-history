package com.example.historyrag.feature.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SystemSettingRequest(
        @NotBlank(message = "Key cấu hình không được để trống")
        @Size(max = 100, message = "Key cấu hình tối đa 100 ký tự")
        @Pattern(regexp = "^[a-z0-9]+(?:[._-][a-z0-9]+)*$", message = "Key chỉ gồm chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang")
        String key,

        @Size(max = 5000000, message = "Giá trị cấu hình tối đa 5MB")
        String value,

        @Size(max = 1000, message = "Mô tả cấu hình tối đa 1000 ký tự")
        String description
) {

    public SystemSettingRequest withKey(String newKey) {
        return new SystemSettingRequest(newKey, value, description);
    }
}
