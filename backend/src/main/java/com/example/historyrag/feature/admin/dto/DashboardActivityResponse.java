package com.example.historyrag.feature.admin.dto;


import lombok.Builder;
@Builder
public record DashboardActivityResponse(
        String id,
        String icon,
        String color,
        String background,
        String text,
        String time
) {
}
