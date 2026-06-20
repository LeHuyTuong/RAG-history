package com.example.historyrag.feature.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateEventRequest(
        @NotBlank(message = "Tên sự kiện không được để trống")
        @Size(max = 500, message = "Tên sự kiện không được vượt quá 500 ký tự")
        String name,
        
        @NotBlank(message = "Slug không được để trống")
        @Size(max = 500, message = "Slug không được vượt quá 500 ký tự")
        String slug,
        
        String description,
        Long periodId,
        Integer startYear,
        Integer endYear,
        LocalDate startDate,
        LocalDate endDate,
        
        @Size(max = 20, message = "Mức độ chính xác không được vượt quá 20 ký tự")
        String certaintyLevel
) {
}
