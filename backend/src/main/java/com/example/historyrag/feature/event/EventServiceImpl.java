package com.example.historyrag.feature.event;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.event.dto.CreateEventRequest;
import com.example.historyrag.feature.event.dto.EventFilterRequest;
import com.example.historyrag.feature.event.dto.EventLocationRelationRequest;
import com.example.historyrag.feature.event.dto.EventResponse;
import com.example.historyrag.feature.event.dto.UpdateEventRequest;
import com.example.historyrag.feature.location.Location;
import com.example.historyrag.feature.location.LocationService;
import com.example.historyrag.feature.period.Period;
import com.example.historyrag.feature.period.PeriodService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private static final String RESOURCE_NAME = "Sự kiện";

    private final EventRepository eventRepository;
    private final PeriodService periodService;
    private final LocationService locationService;

    @Override
    @Transactional
    public EventResponse create(CreateEventRequest request) {
        if (eventRepository.existsBySlug(request.slug())) {
            throw new DuplicateResourceException(RESOURCE_NAME, "slug", request.slug());
        }
        validateTimeRange(request.startYear(), request.endYear(), request.startDate(), request.endDate());

        Event event = new Event();
        applyCreateRequest(event, request);
        event.setPeriod(resolvePeriod(request.periodId()));
        replaceLocationRelations(event, request.locationRelations());

        return EventResponse.fromEntity(eventRepository.save(event));
    }

    @Override
    @Transactional
    public EventResponse update(Long id, UpdateEventRequest request) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(RESOURCE_NAME, "id", id));

        if (!event.getSlug().equals(request.slug()) && eventRepository.existsBySlugAndIdNot(request.slug(), id)) {
            throw new DuplicateResourceException(RESOURCE_NAME, "slug", request.slug());
        }
        validateTimeRange(request.startYear(), request.endYear(), request.startDate(), request.endDate());

        applyUpdateRequest(event, request);
        event.setPeriod(resolvePeriod(request.periodId()));
        replaceLocationRelations(event, request.locationRelations());

        return EventResponse.fromEntity(eventRepository.save(event));
    }

    @Override
    @Transactional(readOnly = true)
    public EventResponse getById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(RESOURCE_NAME, "id", id));
        return EventResponse.fromEntity(event);
    }

    @Override
    @Transactional(readOnly = true)
    public ResultPaginationDTO filter(EventFilterRequest filter, Pageable pageable) {
        PredicateSpecification<Event> spec = EventSpecification.build(filter);
        Page<EventResponse> pageResult = eventRepository.findBy(spec, q -> q.page(pageable))
                .map(EventResponse::fromEntity);
        return ResultPaginationDTO.fromPage(pageResult);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new ResourceNotFoundException(RESOURCE_NAME, "id", id);
        }
        eventRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public long countEvents() {
        return eventRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public Event getEventEntityById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(RESOURCE_NAME, "id", id));
    }

    private void applyCreateRequest(Event event, CreateEventRequest request) {
        event.setName(request.name());
        event.setSlug(request.slug());
        event.setDescription(request.description());
        event.setStartYear(request.startYear());
        event.setEndYear(request.endYear());
        event.setStartDate(request.startDate());
        event.setEndDate(request.endDate());
        event.setCertaintyLevel(request.certaintyLevel());
    }

    private void applyUpdateRequest(Event event, UpdateEventRequest request) {
        event.setName(request.name());
        event.setSlug(request.slug());
        event.setDescription(request.description());
        event.setStartYear(request.startYear());
        event.setEndYear(request.endYear());
        event.setStartDate(request.startDate());
        event.setEndDate(request.endDate());
        event.setCertaintyLevel(request.certaintyLevel());
    }

    private Period resolvePeriod(Long periodId) {
        if (periodId == null) {
            return null;
        }
        return periodService.getPeriodEntityById(periodId);
    }

    private void replaceLocationRelations(
            Event event,
            List<EventLocationRelationRequest> locationRelations) {
        event.getEventLocations().clear();
        if (locationRelations == null || locationRelations.isEmpty()) {
            return;
        }

        validateNoDuplicateLocations(locationRelations);
        Map<Long, Location> locationById = resolveLocations(locationRelations);
        for (EventLocationRelationRequest relation : locationRelations) {
            Location location = locationById.get(relation.locationId());
            event.getEventLocations().add(EventLocation.builder()
                    .id(new EventLocationId(event.getId(), location.getId()))
                    .event(event)
                    .location(location)
                    .relationType(normalizeRelationType(relation.relationType()))
                    .build());
        }
    }

    private void validateNoDuplicateLocations(List<EventLocationRelationRequest> relations) {
        Set<Long> locationIds = new HashSet<>();
        for (EventLocationRelationRequest relation : relations) {
            if (relation == null || relation.locationId() == null) {
                throw new InvalidRequestException("Location relation must include locationId");
            }
            if (!locationIds.add(relation.locationId())) {
                throw new InvalidRequestException("Duplicate locationId in locationRelations: " + relation.locationId());
            }
        }
    }

    private Map<Long, Location> resolveLocations(List<EventLocationRelationRequest> relations) {
        List<Long> locationIds = relations.stream()
                .map(EventLocationRelationRequest::locationId)
                .toList();
        return locationService.getLocationsByIds(locationIds);
    }

    private String normalizeRelationType(String relationType) {
        if (relationType == null || relationType.isBlank()) {
            return null;
        }
        return relationType.trim();
    }

    private void validateTimeRange(
            Integer startYear,
            Integer endYear,
            LocalDate startDate,
            LocalDate endDate) {
        if (startYear != null && endYear != null && endYear < startYear) {
            throw new InvalidRequestException("End year must be greater than or equal to start year");
        }
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new InvalidRequestException("End date must be greater than or equal to start date");
        }
    }
}
