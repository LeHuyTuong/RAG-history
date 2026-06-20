package com.example.historyrag.feature.event;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.event.dto.CreateEventRequest;
import com.example.historyrag.feature.event.dto.EventFilterRequest;
import com.example.historyrag.feature.event.dto.EventResponse;
import com.example.historyrag.feature.event.dto.UpdateEventRequest;
import com.example.historyrag.feature.period.Period;
import com.example.historyrag.feature.period.PeriodRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final PeriodRepository periodRepository;

    public EventServiceImpl(EventRepository eventRepository, PeriodRepository periodRepository) {
        this.eventRepository = eventRepository;
        this.periodRepository = periodRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public ResultPaginationDTO filter(EventFilterRequest filter, Pageable pageable) {
        Page<Event> events = eventRepository.filter(
                filter.getKeyword(),
                filter.getPeriodId(),
                filter.getFromYear(),
                filter.getToYear(),
                filter.getCertaintyLevel(),
                pageable);
        return ResultPaginationDTO.fromPage(events.map(EventResponse::fromEntity));
    }

    @Override
    @Transactional(readOnly = true)
    public EventResponse getById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sự kiện", "id", id));
        return EventResponse.fromEntity(event);
    }

    @Override
    @Transactional
    public EventResponse create(CreateEventRequest request) {
        if (eventRepository.existsBySlug(request.slug())) {
            throw new IllegalArgumentException("Slug đã tồn tại: " + request.slug());
        }

        Period period = null;
        if (request.periodId() != null) {
            period = periodRepository.findById(request.periodId())
                    .orElseThrow(() -> new ResourceNotFoundException("Triều đại", "id", request.periodId()));
        }

        Event event = Event.builder()
                .name(request.name())
                .slug(request.slug())
                .description(request.description())
                .period(period)
                .startYear(request.startYear())
                .endYear(request.endYear())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .certaintyLevel(request.certaintyLevel())
                .build();

        event = eventRepository.save(event);
        return EventResponse.fromEntity(event);
    }

    @Override
    @Transactional
    public EventResponse update(Long id, UpdateEventRequest request) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sự kiện", "id", id));

        if (!event.getSlug().equals(request.slug()) && eventRepository.existsBySlug(request.slug())) {
            throw new IllegalArgumentException("Slug đã tồn tại: " + request.slug());
        }

        Period period = null;
        if (request.periodId() != null) {
            period = periodRepository.findById(request.periodId())
                    .orElseThrow(() -> new ResourceNotFoundException("Triều đại", "id", request.periodId()));
        }

        event.setName(request.name());
        event.setSlug(request.slug());
        event.setDescription(request.description());
        event.setPeriod(period);
        event.setStartYear(request.startYear());
        event.setEndYear(request.endYear());
        event.setStartDate(request.startDate());
        event.setEndDate(request.endDate());
        event.setCertaintyLevel(request.certaintyLevel());

        event = eventRepository.save(event);
        return EventResponse.fromEntity(event);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new ResourceNotFoundException("Sự kiện", "id", id);
        }
        eventRepository.deleteById(id);
    }
}
