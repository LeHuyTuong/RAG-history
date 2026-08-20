package com.example.historyrag.feature.event;

import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.event.dto.CreateEventRequest;
import com.example.historyrag.feature.event.dto.EventLocationRelationRequest;
import com.example.historyrag.feature.period.Period;
import com.example.historyrag.feature.location.LocationService;
import com.example.historyrag.feature.period.PeriodService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceImplValidationTest {

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
    @DisplayName("Should reject create when slug already exists")
    void create_duplicateSlug_throwsDuplicateResourceException() {
        CreateEventRequest request = createRequest("bach-dang");
        when(eventRepository.existsBySlug(request.slug())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> eventService.create(request));

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    @DisplayName("Should reject create when period does not exist")
    void create_missingPeriod_throwsResourceNotFoundException() {
        CreateEventRequest request = createRequest("bach-dang");
        when(eventRepository.existsBySlug(request.slug())).thenReturn(false);
        when(periodService.getPeriodEntityById(request.periodId()))
                .thenThrow(new ResourceNotFoundException("Thời kỳ", "id", request.periodId()));

        assertThrows(ResourceNotFoundException.class, () -> eventService.create(request));
    }

    @Test
    @DisplayName("Should reject create when location does not exist")
    void create_missingLocation_throwsResourceNotFoundException() {
        CreateEventRequest request = createRequest("bach-dang");
        when(eventRepository.existsBySlug(request.slug())).thenReturn(false);
        when(periodService.getPeriodEntityById(request.periodId())).thenReturn(period());
        when(locationService.getLocationsByIds(List.of(2L)))
                .thenThrow(new ResourceNotFoundException("Địa danh", "id", 2L));

        assertThrows(ResourceNotFoundException.class, () -> eventService.create(request));
    }

    @Test
    @DisplayName("Should reject create when location relation contains duplicate location id")
    void create_duplicateLocationRelation_throwsInvalidRequestException() {
        CreateEventRequest request = new CreateEventRequest(
                "Chiến thắng Bạch Đằng",
                "bach-dang",
                "Trận thủy chiến lịch sử",
                1L,
                1288,
                1288,
                LocalDate.parse("1288-01-01"),
                LocalDate.parse("1288-12-31"),
                EventCertaintyLevel.CERTAIN,
                null,
                null,
                List.of(
                        new EventLocationRelationRequest(2L, "BATTLEFIELD"),
                        new EventLocationRelationRequest(2L, "RELATED_TO")
                )
        );
        when(eventRepository.existsBySlug(request.slug())).thenReturn(false);
        when(periodService.getPeriodEntityById(request.periodId())).thenReturn(period());

        assertThrows(InvalidRequestException.class, () -> eventService.create(request));
    }

    @Test
    @DisplayName("Should reject create when year range is invalid")
    void create_invalidYearRange_throwsInvalidRequestException() {
        CreateEventRequest request = new CreateEventRequest(
                "Chiến thắng Bạch Đằng",
                "bach-dang",
                "Trận thủy chiến lịch sử",
                null,
                1288,
                1287,
                LocalDate.parse("1288-01-01"),
                LocalDate.parse("1288-12-31"),
                EventCertaintyLevel.CERTAIN,
                null,
                null,
                List.of()
        );
        when(eventRepository.existsBySlug(request.slug())).thenReturn(false);

        assertThrows(InvalidRequestException.class, () -> eventService.create(request));
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
                null,
                null,
                List.of(new EventLocationRelationRequest(2L, "BATTLEFIELD"))
        );
    }

    private Period period() {
        Period period = new Period();
        period.setId(1L);
        period.setName("Nhà Trần");
        period.setSlug("nha-tran");
        return period;
    }
}
