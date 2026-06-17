package com.example.historyrag.feature.tag;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.feature.tag.dto.TagRequest;
import com.example.historyrag.feature.tag.dto.TagResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/tags")
@PreAuthorize("hasRole('ADMIN')")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TagResponse>>> getAllTags(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(tagService.getAllTags(pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TagResponse>> createTag(@RequestBody @Valid TagRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(tagService.createTag(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TagResponse>> updateTag(
            @PathVariable Long id,
            @RequestBody @Valid TagRequest request) {
        return ResponseEntity.ok(ApiResponse.success(tagService.updateTag(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTag(@PathVariable Long id) {
        tagService.deleteTag(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}