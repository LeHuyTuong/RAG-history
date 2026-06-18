package com.example.historyrag.feature.engagement;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.engagement.dto.EngagementModerationRequest;
import com.example.historyrag.feature.engagement.dto.EngagementResponse;
import org.springframework.data.domain.Pageable;

public interface EngagementService {
    ResultPaginationDTO getPendingComments(Pageable pageable);
    EngagementResponse moderateComment(Long engagementId, EngagementModerationRequest request);
}
