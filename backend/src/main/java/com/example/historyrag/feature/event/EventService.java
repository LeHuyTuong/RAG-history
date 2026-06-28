package com.example.historyrag.feature.event;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.event.dto.CreateEventRequest;
import com.example.historyrag.feature.event.dto.EventFilterRequest;
import com.example.historyrag.feature.event.dto.EventResponse;
import com.example.historyrag.feature.event.dto.UpdateEventRequest;
import org.springframework.data.domain.Pageable;

public interface EventService {

    EventResponse create(CreateEventRequest request);

    EventResponse update(Long id, UpdateEventRequest request);

    EventResponse getById(Long id);

    ResultPaginationDTO filter(EventFilterRequest filter, Pageable pageable);

    void delete(Long id);

    long countEvents();

    Event getEventEntityById(Long id);
}
