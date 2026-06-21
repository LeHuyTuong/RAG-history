package com.example.historyrag.feature.participation;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.participation.dto.CreateParticipationRequest;
import com.example.historyrag.feature.participation.dto.ParticipationFilterRequest;
import com.example.historyrag.feature.participation.dto.ParticipationResponse;
import com.example.historyrag.feature.participation.dto.UpdateParticipationRequest;
import org.springframework.data.domain.Pageable;

public interface ParticipationService {

    ParticipationResponse create(CreateParticipationRequest request);

    ParticipationResponse update(Long id, UpdateParticipationRequest request);

    ParticipationResponse getById(Long id);

    ResultPaginationDTO filter(ParticipationFilterRequest filter, Pageable pageable);

    void delete(Long id);
}
