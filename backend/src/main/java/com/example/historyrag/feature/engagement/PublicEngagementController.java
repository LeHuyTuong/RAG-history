package com.example.historyrag.feature.engagement;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.feature.engagement.dto.EngagementResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/engagements")
@RequiredArgsConstructor
public class PublicEngagementController {

    private final EngagementRepository engagementRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EngagementResponse>>> getEngagementsByPost(
            @RequestParam Long postId) {
        
        List<Engagement> engagements = engagementRepository.findByPostIdAndEngagementTypeAndCommentStatus(
                postId, EngagementType.COMMENT, CommentStatus.VISIBLE);
                
        List<EngagementResponse> response = engagements.stream()
                .map(EngagementResponse::fromEntity)
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách bình luận thành công", response));
    }
}
