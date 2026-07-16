package com.example.historyrag.feature.period;

import com.example.historyrag.feature.post.PostStatus;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.exception.ConflictException;
import com.example.historyrag.feature.period.dto.PeriodRequest;
import com.example.historyrag.feature.period.dto.PeriodResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PeriodServiceImpl implements PeriodService {

    private final PeriodRepository periodRepository;

    @Override
    @Transactional
    public PeriodResponse createPeriod(PeriodRequest request) {
        if (periodRepository.existsByName(request.name())) {
            throw new ConflictException("Period name already exists: " + request.name());
        }
        if (periodRepository.existsBySlug(request.slug())) {
            throw new ConflictException("Period slug already exists: " + request.slug());
        }

        Period period = new Period();
        period.setName(request.name());
        period.setSlug(request.slug());
        period.setStartYear(request.startYear());
        period.setEndYear(request.endYear());
        period.setDescription(request.description());
        period.setPhilosophy(request.philosophy());
        period.setImageUrl(request.imageUrl());
        period.setEmperors(request.emperors());
        period.setRelatedLocations(request.relatedLocations());
        period.setRelatedEvents(request.relatedEvents());
        period.setRelatedArticles(request.relatedArticles());
        if (request.status() != null) {
            period.setStatus(request.status());
        }

        Period saved = periodRepository.save(period);
        return PeriodResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public PeriodResponse updatePeriod(Long id, PeriodRequest request) {
        Period period = periodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Period", "id", id));

        if (!period.getName().equals(request.name()) && periodRepository.existsByName(request.name())) {
            throw new ConflictException("Period name already exists: " + request.name());
        }
        if (!period.getSlug().equals(request.slug()) && periodRepository.existsBySlug(request.slug())) {
            throw new ConflictException("Period slug already exists: " + request.slug());
        }

        period.setName(request.name());
        period.setSlug(request.slug());
        period.setStartYear(request.startYear());
        period.setEndYear(request.endYear());
        period.setDescription(request.description());
        period.setPhilosophy(request.philosophy());
        period.setImageUrl(request.imageUrl());
        period.setEmperors(request.emperors());
        period.setRelatedLocations(request.relatedLocations());
        period.setRelatedEvents(request.relatedEvents());
        period.setRelatedArticles(request.relatedArticles());
        if (request.status() != null) {
            period.setStatus(request.status());
        }

        Period updated = periodRepository.save(period);
        return PeriodResponse.fromEntity(updated);
    }

    @Override
    public ResultPaginationDTO getAllPeriods(String keyword, String status, Pageable pageable) {
        Page<Period> periods;
        PostStatus postStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                postStatus = PostStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // ignore
            }
        }

        if (keyword != null && !keyword.isBlank()) {
            if (postStatus != null) {
                periods = periodRepository.findByNameContainingIgnoreCaseAndStatus(keyword, postStatus, pageable);
            } else {
                periods = periodRepository.findByNameContainingIgnoreCase(keyword, pageable);
            }
        } else {
            if (postStatus != null) {
                periods = periodRepository.findByStatus(postStatus, pageable);
            } else {
                periods = periodRepository.findAll(pageable);
            }
        }
        return ResultPaginationDTO.fromPage(periods.map(PeriodResponse::fromEntity));
    }

    @Override
    @Transactional
    public void deletePeriod(Long id) {
        if (!periodRepository.existsById(id)) {
            throw new ResourceNotFoundException("Period", "id", id);
        }
        periodRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public long countPeriods() {
        return periodRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public Period getPeriodEntityById(Long id) {
        return periodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thời kỳ", "id", id));
    }
}
