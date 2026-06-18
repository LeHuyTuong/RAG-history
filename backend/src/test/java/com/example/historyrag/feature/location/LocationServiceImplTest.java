package com.example.historyrag.feature.location;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.location.dto.CreateLocationRequest;
import com.example.historyrag.feature.location.dto.LocationFilterRequest;
import com.example.historyrag.feature.location.dto.LocationResponse;
import com.example.historyrag.feature.location.dto.UpdateLocationRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.PredicateSpecification;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocationServiceImplTest {

    @Mock
    private LocationRepository locationRepository;

    private LocationServiceImpl locationService;

    @BeforeEach
    void setUp() {
        locationService = new LocationServiceImpl(locationRepository);
    }

    @Test
    @DisplayName("Should create location when slug is unique")
    void create_uniqueSlug_returnsLocationResponse() {
        CreateLocationRequest request = createRequest("co-loa");
        when(locationRepository.existsBySlug(request.slug())).thenReturn(false);
        when(locationRepository.save(any(Location.class))).thenAnswer(invocation -> {
            Location saved = invocation.getArgument(0);
            saved.setId(1L);
            saved.setCreatedAt(Instant.parse("2026-06-16T00:00:00Z"));
            saved.setUpdatedAt(Instant.parse("2026-06-16T01:00:00Z"));
            return saved;
        });

        LocationResponse response = locationService.create(request);

        assertEquals(1L, response.id());
        assertEquals("Cổ Loa", response.name());
        assertEquals(LocationType.CAPITAL, response.locationType());
        assertEquals(new BigDecimal("21.116667"), response.latitude());
    }

    @Test
    @DisplayName("Should reject create when slug already exists")
    void create_duplicateSlug_throwsDuplicateResourceException() {
        CreateLocationRequest request = createRequest("co-loa");
        when(locationRepository.existsBySlug(request.slug())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> locationService.create(request));

        verify(locationRepository, never()).save(any(Location.class));
    }

    @Test
    @DisplayName("Should update location when it exists")
    void update_existingLocation_returnsUpdatedLocationResponse() {
        Location location = location(1L, "co-loa");
        UpdateLocationRequest request = updateRequest("thanh-co-loa");
        when(locationRepository.findById(location.getId())).thenReturn(Optional.of(location));
        when(locationRepository.existsBySlugAndIdNot(request.slug(), location.getId())).thenReturn(false);
        when(locationRepository.save(location)).thenReturn(location);

        LocationResponse response = locationService.update(location.getId(), request);

        assertEquals("Thành Cổ Loa", response.name());
        assertEquals("thanh-co-loa", response.slug());
        assertEquals(LocationType.TEMPLE, response.locationType());
    }

    @Test
    @DisplayName("Should reject update when location does not exist")
    void update_missingLocation_throwsResourceNotFoundException() {
        UpdateLocationRequest request = updateRequest("missing");
        when(locationRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> locationService.update(404L, request));
    }

    @Test
    @DisplayName("Should reject update when slug already exists on another location")
    void update_duplicateSlug_throwsDuplicateResourceException() {
        Location location = location(1L, "co-loa");
        UpdateLocationRequest request = updateRequest("bach-dang");
        when(locationRepository.findById(location.getId())).thenReturn(Optional.of(location));
        when(locationRepository.existsBySlugAndIdNot(request.slug(), location.getId())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> locationService.update(location.getId(), request));

        verify(locationRepository, never()).save(any(Location.class));
    }

    @Test
    @DisplayName("Should return location detail by id")
    void getById_existingLocation_returnsLocationResponse() {
        Location location = location(1L, "co-loa");
        when(locationRepository.findById(location.getId())).thenReturn(Optional.of(location));

        LocationResponse response = locationService.getById(location.getId());

        assertEquals(location.getId(), response.id());
        assertEquals(location.getSlug(), response.slug());
    }

    @Test
    @DisplayName("Should return ResultPaginationDTO when filtering locations")
    @SuppressWarnings({"unchecked", "rawtypes"})
    void filter_existingLocations_returnsPaginationDTO() {
        PageRequest pageable = PageRequest.of(0, 10);
        Location location = location(1L, "co-loa");
        PageImpl<Location> page = new PageImpl<>(List.of(location), pageable, 1);
        when(locationRepository.findBy(any(PredicateSpecification.class), any(Function.class))).thenReturn(page);

        ResultPaginationDTO result = locationService.filter(
                new LocationFilterRequest("co loa", LocationType.CAPITAL),
                pageable);

        assertEquals(1, result.meta().page());
        assertEquals(10, result.meta().pageSize());
        assertEquals(1, result.meta().total());
        assertEquals(1, result.result().size());
    }

    @Test
    @DisplayName("Should delete location when it exists")
    void delete_existingLocation_deletesById() {
        when(locationRepository.existsById(1L)).thenReturn(true);

        locationService.delete(1L);

        verify(locationRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Should reject delete when location does not exist")
    void delete_missingLocation_throwsResourceNotFoundException() {
        when(locationRepository.existsById(404L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> locationService.delete(404L));
    }

    private CreateLocationRequest createRequest(String slug) {
        return new CreateLocationRequest(
                "Cổ Loa",
                slug,
                LocationType.CAPITAL,
                new BigDecimal("21.116667"),
                new BigDecimal("105.866667"),
                "Kinh đô cổ"
        );
    }

    private UpdateLocationRequest updateRequest(String slug) {
        return new UpdateLocationRequest(
                "Thành Cổ Loa",
                slug,
                LocationType.TEMPLE,
                new BigDecimal("21.116000"),
                new BigDecimal("105.866000"),
                "Di tích lịch sử"
        );
    }

    private Location location(Long id, String slug) {
        Location location = new Location();
        location.setId(id);
        location.setName("Cổ Loa");
        location.setSlug(slug);
        location.setLocationType(LocationType.CAPITAL);
        location.setLatitude(new BigDecimal("21.116667"));
        location.setLongitude(new BigDecimal("105.866667"));
        location.setDescription("Kinh đô cổ");
        location.setCreatedAt(Instant.parse("2026-06-16T00:00:00Z"));
        location.setUpdatedAt(Instant.parse("2026-06-16T01:00:00Z"));
        return location;
    }
}
