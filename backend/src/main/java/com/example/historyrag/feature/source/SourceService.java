package com.example.historyrag.feature.source;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.source.dto.CreateSourceRequest;
import com.example.historyrag.feature.source.dto.SourceFilterRequest;
import com.example.historyrag.feature.source.dto.SourceResponse;
import com.example.historyrag.feature.source.dto.UpdateSourceRequest;
import org.springframework.data.domain.Pageable;

public interface SourceService {

    SourceResponse create(CreateSourceRequest request);

    SourceResponse update(Long id, UpdateSourceRequest request);

    SourceResponse getById(Long id);

    ResultPaginationDTO filter(SourceFilterRequest filter, Pageable pageable);

    void delete(Long id);
}
