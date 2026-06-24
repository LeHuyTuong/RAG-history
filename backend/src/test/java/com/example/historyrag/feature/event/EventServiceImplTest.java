package com.example.historyrag.feature.event;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.event.dto.CreateEventRequest;
import com.example.historyrag.feature.event.dto.EventFilterRequest;
import com.example.historyrag.feature.event.dto.EventLocationRelationRequest;
import com.example.historyrag.feature.event.dto.EventResponse;
import com.example.historyrag.feature.event.dto.UpdateEventRequest;
import com.example.historyrag.feature.location.Location;
import com.example.historyrag.feature.location.LocationService;
import com.example.historyrag.feature.location.LocationType;
import com.example.historyrag.feature.period.Period;
import com.example.historyrag.feature.period.PeriodService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.PredicateSpecification;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private PeriodService periodService;

    @Mock
    private LocationService locationService;

    private EventServiceImpl eventService;

    @BeforeEach
    void setUp() {
        eventService = new EventServiceImpl(eventRepository, periodService, locationService);
    }

    @Test
    @DisplayName("Should create event with period and location relations")
    void create_validRequest_returnsEventResponse() {
        CreateEventRequest request = createRequest("chien-thang-bach-dang");
        Period period = period();
        Location location = location(2L);
        when(eventRepository.existsBySlug(request.slug())).thenReturn(false);
        when(periodService.getPeriodEntityById(request.periodId())).thenReturn(period);
        when(locationService.getLocationsByIds(List.of(2L))).thenReturn(Map.of(2L, location));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> {
            Event saved = invocation.getArgument(0);
            saved.setId(1L);
            saved.setCreatedAt(Instant.parse("2026-06-16T00:00:00Z"));
            saved.setUpdatedAt(Instant.parse("2026-06-16T01:00:00Z"));
            return saved;
        });

        EventResponse response = eventService.create(request);

        assertEquals(1L, response.id());
        assertEquals("Chiến thắng Bạch Đằng", response.name());
        assertEquals(EventCertaintyLevel.CERTAIN, response.certaintyLevel());
        assertEquals(period.getId(), response.period().id());
        assertEquals(1, response.locationRelations().size());
        assertEquals("BATTLEFIELD", response.locationRelations().getFirst().relationType());
    }

    @Test
    @DisplayName("Should update event and replace location relations")
    void update_existingEvent_returnsUpdatedEventResponse() {
        Event event = event(1L, "bach-dang");
        UpdateEventRequest request = updateRequest("chien-thang-bach-dang-1288");
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(eventRepository.existsBySlugAndIdNot(request.slug(), event.getId())).thenReturn(false);
        when(periodService.getPeriodEntityById(request.periodId())).thenReturn(period());
        when(locationService.getLocationsByIds(List.of(2L))).thenReturn(Map.of(2L, location(2L)));
        when(eventRepository.save(event)).thenReturn(event);

        EventResponse response = eventService.update(event.getId(), request);

        assertEquals("Chiến thắng Bạch Đằng cập nhật", response.name());
        assertEquals("chien-thang-bach-dang-1288", response.slug());
        assertEquals(1, response.locationRelations().size());
    }

    @Test
    @DisplayName("Should reject update when event does not exist")
    void update_missingEvent_throwsResourceNotFoundException() {
        UpdateEventRequest request = updateRequest("missing");
        when(eventRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> eventService.update(404L, request));
    }

    @Test
    @DisplayName("Should reject update when slug already exists on another event")
    void update_duplicateSlug_throwsDuplicateResourceException() {
        Event event = event(1L, "bach-dang");
        UpdateEventRequest request = updateRequest("existing-slug");
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(eventRepository.existsBySlugAndIdNot(request.slug(), event.getId())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> eventService.update(event.getId(), request));

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    @DisplayName("Should return event detail by id")
    void getById_existingEvent_returnsEventResponse() {
        Event event = event(1L, "bach-dang");
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));

        EventResponse response = eventService.getById(event.getId());

        assertEquals(event.getId(), response.id());
        assertEquals(event.getSlug(), response.slug());
    }

    @Test
    @DisplayName("Should reject get by id when event does not exist")
    void getById_missingEvent_throwsResourceNotFoundException() {
        when(eventRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> eventService.getById(404L));
    }

    @Test
    @DisplayName("Should return ResultPaginationDTO when filtering events")
    @SuppressWarnings({"unchecked", "rawtypes"})
    void filter_existingEvents_returnsPaginationDTO() {
        PageRequest pageable = PageRequest.of(0, 10);
        Event event = event(1L, "bach-dang");
        PageImpl<Event> page = new PageImpl<>(List.of(event), pageable, 1);
        when(eventRepository.findBy(any(PredicateSpecification.class), any(Function.class))).thenReturn(page);

        ResultPaginationDTO result = eventService.filter(
                new EventFilterRequest("bach dang", 1L, 2L, EventCertaintyLevel.CERTAIN, 1200, 1300),
                pageable);

        assertEquals(1, result.meta().page());
        assertEquals(10, result.meta().pageSize());
        assertEquals(1, result.meta().total());
        assertEquals(1, result.result().size());
    }

    @Test
    @DisplayName("Should delete event when it exists")
    void delete_existingEvent_deletesById() {
        when(eventRepository.existsById(1L)).thenReturn(true);

        eventService.delete(1L);

        verify(eventRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Should reject delete when event does not exist")
    void delete_missingEvent_throwsResourceNotFoundException() {
        when(eventRepository.existsById(404L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> eventService.delete(404L));
    }

    @Test
    @DisplayName("Should save event with replaced relation collection")
    void update_existingEvent_replacesLocationRelationCollection() {
        Event event = event(1L, "bach-dang");
        Location oldLocation = location(1L);
        event.getEventLocations().add(EventLocation.builder()
                .id(new EventLocationId(event.getId(), oldLocation.getId()))
                .event(event)
                .location(oldLocation)
                .relationType("OLD")
                .build());
        UpdateEventRequest request = updateRequest("bach-dang");
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(periodService.getPeriodEntityById(request.periodId())).thenReturn(period());
        when(locationService.getLocationsByIds(List.of(2L))).thenReturn(Map.of(2L, location(2L)));
        when(eventRepository.save(event)).thenReturn(event);

        eventService.update(event.getId(), request);

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());
        assertEquals(1, captor.getValue().getEventLocations().size());
        assertEquals(2L, captor.getValue().getEventLocations().getFirst().getLocation().getId());
    }

    private CreateEventRequest createRequest(String slug) {
        return new CreateEventRequest(
                "Chiến thắng Bạch Đằng",
                slug,
                "Trận thủy chiến lịch sử",
                1L,
                1288,
                1288,
                LocalDate.parse("1288-01-01"),
                LocalDate.parse("1288-12-31"),
                EventCertaintyLevel.CERTAIN,
                List.of(new EventLocationRelationRequest(2L, "BATTLEFIELD"))
        );
    }

    private UpdateEventRequest updateRequest(String slug) {
        return new UpdateEventRequest(
                "Chiến thắng Bạch Đằng cập nhật",
                slug,
                "Trận thủy chiến lịch sử",
                1L,
                1288,
                1288,
                LocalDate.parse("1288-01-01"),
                LocalDate.parse("1288-12-31"),
                EventCertaintyLevel.CERTAIN,
                List.of(new EventLocationRelationRequest(2L, "BATTLEFIELD"))
        );
    }

    private Event event(Long id, String slug) {
        Event event = new Event();
        event.setId(id);
        event.setName("Chiến thắng Bạch Đằng");
        event.setSlug(slug);
        event.setDescription("Trận thủy chiến lịch sử");
        event.setPeriod(period());
        event.setStartYear(1288);
        event.setEndYear(1288);
        event.setStartDate(LocalDate.parse("1288-01-01"));
        event.setEndDate(LocalDate.parse("1288-12-31"));
        event.setCertaintyLevel(EventCertaintyLevel.CERTAIN);
        event.setCreatedAt(Instant.parse("2026-06-16T00:00:00Z"));
        event.setUpdatedAt(Instant.parse("2026-06-16T01:00:00Z"));
        return event;
    }

    private Period period() {
        Period period = new Period();
        period.setId(1L);
        period.setName("Nhà Trần");
        period.setSlug("nha-tran");
        return period;
    }

    private Location location(Long id) {
        Location location = new Location();
        location.setId(id);
        location.setName("Bạch Đằng");
        location.setSlug("bach-dang");
        location.setLocationType(LocationType.BATTLEFIELD);
        return location;
    }
}
