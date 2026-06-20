package com.example.historyrag.feature.event.dto;

import lombok.Data;

@Data
public class EventFilterRequest {
    private String keyword;
    private Long periodId;
    private Integer fromYear;
    private Integer toYear;
    private String certaintyLevel;
}
