package com.example.historyrag.feature.engagement;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.feature.engagement.dto.EngagementModerationRequest;
import com.example.historyrag.feature.engagement.dto.EngagementResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EngagementServiceImpl implements EngagementService {

    private final EngagementRepository engagementRepository;

    public EngagementServiceImpl(EngagementRepository engagementRepository) {
        this.engagementRepository = engagementRepository;
    }
    @Override
    public ResultPaginationDTO getPendingComments(Pageable pageable) {
        return ResultPaginationDTO.fromPage(engagementRepository.findByEngagementTypeAndCommentStatus(
                EngagementType.COMMENT,
                CommentStatus.PENDING,
                pageable
        ).map(EngagementResponse::fromEntity));
    }

    @Override
    @Transactional
    public EngagementResponse moderateComment(Long engagementId, EngagementModerationRequest request) {
        Engagement engagement = engagementRepository.findById(engagementId)
                .orElseThrow(() -> new ResourceNotFoundException("Engagement", "id", engagementId));

        if (engagement.getEngagementType() != EngagementType.COMMENT) {
            throw new InvalidRequestException("Only COMMENT type can be moderated");
        }
        engagement.setCommentStatus(request.status());
        return EngagementResponse.fromEntity(engagementRepository.save(engagement));
    }
}
