package com.example.historyrag.feature.period;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.period.dto.PeriodRequest;
import com.example.historyrag.feature.period.dto.PeriodResponse;
import org.springframework.data.domain.Pageable;

public interface PeriodService {
    PeriodResponse createPeriod(PeriodRequest request);
    PeriodResponse updatePeriod(Long id, PeriodRequest request);
    ResultPaginationDTO getAllPeriods(String keyword, Pageable pageable);
    void deletePeriod(Long id);
}
