package com.example.historyrag.feature.period;

import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.feature.period.dto.PeriodRequest;
import com.example.historyrag.feature.period.dto.PeriodResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

@Service
public class PeriodServiceImpl implements PeriodService {

    private final PeriodRepository periodRepository;

    public PeriodServiceImpl(PeriodRepository periodRepository) {
        this.periodRepository = periodRepository;
    }

    @Override
    @Transactional
    public PeriodResponse createPeriod(PeriodRequest request) {
        if (periodRepository.existsByName(request.name())) {
            throw new InvalidRequestException("Period name already exists: " + request.name());
        }
        if (periodRepository.existsBySlug(request.slug())) {
            throw new InvalidRequestException("Period slug already exists: " + request.slug());
        }
        Period period = new Period();
        period.setName(request.name());
        period.setSlug(request.slug());
        period.setStartYear(request.startYear());
        period.setEndYear(request.endYear());
        period.setDescription(request.description());
        period.setCreatedAt(Instant.now());
        period.setUpdatedAt(Instant.now());
        return PeriodResponse.fromEntity(periodRepository.save(period));
    }

    @Override
    @Transactional
    public PeriodResponse updatePeriod(Long id, PeriodRequest request) {
        Period period = periodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Period", "id", id));

        if (!period.getName().equals(request.name()) && periodRepository.existsByName(request.name())) {
            throw new InvalidRequestException("Period name already exists: " + request.name());
        }
        if (!period.getSlug().equals(request.slug()) && periodRepository.existsBySlug(request.slug())) {
            throw new InvalidRequestException("Period slug already exists: " + request.slug());
        }
        period.setName(request.name());
        period.setSlug(request.slug());
        period.setStartYear(request.startYear());
        period.setEndYear(request.endYear());
        period.setDescription(request.description());
        period.setUpdatedAt(Instant.now());

        return PeriodResponse.fromEntity(periodRepository.save(period));
    }

    @Override
    public Page<PeriodResponse> getAllPeriods(Pageable pageable) {
        return periodRepository.findAll(pageable).map(PeriodResponse::fromEntity);
    }

    @Override
    @Transactional
    public void deletePeriod(Long id) {
        if (!periodRepository.existsById(id)) {
            throw new ResourceNotFoundException("Period", "id", id);
        }
        periodRepository.deleteById(id);
    }
}