package com.example.historyrag.feature.rag;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.feature.post.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/ai")
@RequiredArgsConstructor
public class AdminAiController {

    private final PostService postService;

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> syncAll() {
        int synced = postService.syncAllPublishedToRag();
        return ResponseEntity.ok(ApiResponse.success(Map.of("synced", synced)));
    }
}
