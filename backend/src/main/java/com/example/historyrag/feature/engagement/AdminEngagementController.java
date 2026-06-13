package com.example.historyrag.feature.engagement;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.feature.engagement.dto.EngagementModerationRequest;
import com.example.historyrag.feature.engagement.dto.EngagementResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/engagements")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEngagementController {

    private final EngagementService engagementService;

    public AdminEngagementController(EngagementService engagementService) {
        this.engagementService = engagementService;
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<Page<EngagementResponse>>> getPendingComments(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(engagementService.getPendingComments(pageable)));
    }

    @PutMapping("/{id}/moderate")
    public ResponseEntity<ApiResponse<EngagementResponse>> moderateComment(
            @PathVariable Long id,
            @RequestBody @Valid EngagementModerationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(engagementService.moderateComment(id, request)));
    }
}