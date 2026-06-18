package com.example.historyrag.feature.source;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.source.dto.CreateSourceRequest;
import com.example.historyrag.feature.source.dto.SourceFilterRequest;
import com.example.historyrag.feature.source.dto.SourceResponse;
import com.example.historyrag.feature.source.dto.UpdateSourceRequest;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/admin/sources")
@PreAuthorize("hasRole('ADMIN')")
public class SourceController {

    private final SourceService sourceService;

    public SourceController(SourceService sourceService) {
        this.sourceService = sourceService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ResultPaginationDTO>> filter(
            @ParameterObject SourceFilterRequest filter,
            @ParameterObject Pageable pageable) {
        ResultPaginationDTO result = sourceService.filter(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách nguồn tư liệu thành công", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SourceResponse>> getById(@PathVariable Long id) {
        SourceResponse response = sourceService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin nguồn tư liệu thành công", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SourceResponse>> create(@Valid @RequestBody CreateSourceRequest request) {
        SourceResponse response = sourceService.create(request);
        URI location = URI.create("/api/v1/admin/sources/" + response.id());
        return ResponseEntity.created(location)
                .body(ApiResponse.created("Tạo nguồn tư liệu thành công", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SourceResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSourceRequest request) {
        SourceResponse response = sourceService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật nguồn tư liệu thành công", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        sourceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa nguồn tư liệu thành công", null));
    }
}
