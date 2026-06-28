package com.example.historyrag.feature.location;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.location.dto.CreateLocationRequest;
import com.example.historyrag.feature.location.dto.LocationFilterRequest;
import com.example.historyrag.feature.location.dto.LocationResponse;
import com.example.historyrag.feature.location.dto.UpdateLocationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationServiceImpl implements LocationService {

    private final LocationRepository locationRepository;

    @Override
    @Transactional
    public LocationResponse create(CreateLocationRequest request) {
        if (locationRepository.existsBySlug(request.slug())) {
            throw new DuplicateResourceException("Địa danh", "slug", request.slug());
        }

        Location location = new Location();
        applyCreateRequest(location, request);
        return LocationResponse.fromEntity(locationRepository.save(location));
    }

    @Override
    @Transactional
    public LocationResponse update(Long id, UpdateLocationRequest request) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Địa danh", "id", id));

        if (!location.getSlug().equals(request.slug()) && locationRepository.existsBySlugAndIdNot(request.slug(), id)) {
            throw new DuplicateResourceException("Địa danh", "slug", request.slug());
        }

        applyUpdateRequest(location, request);
        return LocationResponse.fromEntity(locationRepository.save(location));
    }

    @Override
    @Transactional(readOnly = true)
    public LocationResponse getById(Long id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Địa danh", "id", id));
        return LocationResponse.fromEntity(location);
    }

    @Override
    @Transactional(readOnly = true)
    public ResultPaginationDTO filter(LocationFilterRequest filter, Pageable pageable) {
        PredicateSpecification<Location> spec = LocationSpecification.build(filter);
        Page<LocationResponse> pageResult = locationRepository.findBy(spec, q -> q.page(pageable))
                .map(LocationResponse::fromEntity);
        return ResultPaginationDTO.fromPage(pageResult);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!locationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Địa danh", "id", id);
        }
        locationRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public long countLocations() {
        return locationRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, Location> getLocationsByIds(List<Long> ids) {
        List<Location> locations = locationRepository.findAllById(ids);
        Map<Long, Location> locationById = locations.stream()
                .collect(Collectors.toMap(Location::getId, Function.identity()));

        for (Long id : ids) {
            if (!locationById.containsKey(id)) {
                throw new ResourceNotFoundException("Địa danh", "id", id);
            }
        }
        return locationById;
    }

    private void applyCreateRequest(Location location, CreateLocationRequest request) {
        location.setName(request.name());
        location.setSlug(request.slug());
        location.setLocationType(request.locationType());
        location.setLatitude(request.latitude());
        location.setLongitude(request.longitude());
        location.setDescription(request.description());
    }

    private void applyUpdateRequest(Location location, UpdateLocationRequest request) {
        location.setName(request.name());
        location.setSlug(request.slug());
        location.setLocationType(request.locationType());
        location.setLatitude(request.latitude());
        location.setLongitude(request.longitude());
        location.setDescription(request.description());
    }
}
