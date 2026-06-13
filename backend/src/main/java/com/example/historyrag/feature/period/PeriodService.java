package com.example.historyrag.feature.period;

import com.example.historyrag.feature.period.dto.PeriodRequest;
import com.example.historyrag.feature.period.dto.PeriodResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PeriodService {
    PeriodResponse createPeriod(PeriodRequest request);
    PeriodResponse updatePeriod(Long id, PeriodRequest request);
    Page<PeriodResponse> getAllPeriods(Pageable pageable);
    void deletePeriod(Long id);
}