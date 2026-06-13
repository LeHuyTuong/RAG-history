package com.example.historyrag.feature.engagement;

import com.example.historyrag.feature.engagement.dto.EngagementModerationRequest;
import com.example.historyrag.feature.engagement.dto.EngagementResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EngagementService {
    Page<EngagementResponse> getPendingComments(Pageable pageable);
    EngagementResponse moderateComment(Long engagementId, EngagementModerationRequest request);
}
