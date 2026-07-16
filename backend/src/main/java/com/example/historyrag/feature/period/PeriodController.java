package com.example.historyrag.feature.period;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.period.dto.PeriodRequest;
import com.example.historyrag.feature.period.dto.PeriodResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/periods")
@RequiredArgsConstructor
public class PeriodController {

    private final PeriodService periodService;

    @GetMapping
    public ResponseEntity<ApiResponse<ResultPaginationDTO>> getAllPeriods(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @ParameterObject @PageableDefault(size = 20, sort = "startYear", direction = Sort.Direction.ASC) Pageable pageable) {
        ResultPaginationDTO result = periodService.getAllPeriods(keyword, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PeriodResponse>> getPeriodById(@PathVariable Long id) {
        Period period = periodService.getPeriodEntityById(id);
        return ResponseEntity.ok(ApiResponse.success(PeriodResponse.fromEntity(period)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<PeriodResponse>> createPeriod(@RequestBody @Valid PeriodRequest request) {
        PeriodResponse result = periodService.createPeriod(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(result));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PeriodResponse>> updatePeriod(
            @PathVariable Long id,
            @RequestBody @Valid PeriodRequest request) {
        PeriodResponse result = periodService.updatePeriod(id, request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePeriod(@PathVariable Long id) {
        periodService.deletePeriod(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
