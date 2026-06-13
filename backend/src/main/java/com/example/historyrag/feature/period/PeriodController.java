package com.example.historyrag.feature.period;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.feature.period.dto.PeriodRequest;
import com.example.historyrag.feature.period.dto.PeriodResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/periods")
@PreAuthorize("hasRole('ADMIN')")
public class PeriodController {

    private final PeriodService periodService;

    public PeriodController(PeriodService periodService) {
        this.periodService = periodService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PeriodResponse>>> getAllPeriods(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(periodService.getAllPeriods(pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PeriodResponse>> createPeriod(@RequestBody @Valid PeriodRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(periodService.createPeriod(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PeriodResponse>> updatePeriod(
            @PathVariable Long id,
            @RequestBody @Valid PeriodRequest request) {
        return ResponseEntity.ok(ApiResponse.success(periodService.updatePeriod(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePeriod(@PathVariable Long id) {
        periodService.deletePeriod(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}