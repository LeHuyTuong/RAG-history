package com.example.historyrag.feature.event;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.event.dto.CreateEventRequest;
import com.example.historyrag.feature.event.dto.EventFilterRequest;
import com.example.historyrag.feature.event.dto.EventResponse;
import com.example.historyrag.feature.event.dto.UpdateEventRequest;
import org.springframework.data.domain.Pageable;

public interface EventService {
    ResultPaginationDTO filter(EventFilterRequest filter, Pageable pageable);
    EventResponse getById(Long id);
    EventResponse create(CreateEventRequest request);
    EventResponse update(Long id, UpdateEventRequest request);
    void delete(Long id);
}
