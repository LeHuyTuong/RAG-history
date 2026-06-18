package com.example.historyrag.feature.location;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.location.dto.CreateLocationRequest;
import com.example.historyrag.feature.location.dto.LocationFilterRequest;
import com.example.historyrag.feature.location.dto.LocationResponse;
import com.example.historyrag.feature.location.dto.UpdateLocationRequest;
import org.springframework.data.domain.Pageable;

public interface LocationService {

    LocationResponse create(CreateLocationRequest request);

    LocationResponse update(Long id, UpdateLocationRequest request);

    LocationResponse getById(Long id);

    ResultPaginationDTO filter(LocationFilterRequest filter, Pageable pageable);

    void delete(Long id);
}
