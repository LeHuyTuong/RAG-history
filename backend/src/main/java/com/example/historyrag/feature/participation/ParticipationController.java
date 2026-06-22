package com.example.historyrag.feature.participation;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.participation.dto.CreateParticipationRequest;
import com.example.historyrag.feature.participation.dto.ParticipationFilterRequest;
import com.example.historyrag.feature.participation.dto.ParticipationResponse;
import com.example.historyrag.feature.participation.dto.UpdateParticipationRequest;
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
@RequestMapping("/api/v1/admin/participations")
@PreAuthorize("hasRole('ADMIN')")
public class ParticipationController {

    private final ParticipationService participationService;

    public ParticipationController(ParticipationService participationService) {
        this.participationService = participationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ResultPaginationDTO>> filter(
            @ParameterObject ParticipationFilterRequest filter,
            @ParameterObject Pageable pageable) {
        ResultPaginationDTO result = participationService.filter(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tham gia sự kiện thành công", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ParticipationResponse>> getById(@PathVariable Long id) {
        ParticipationResponse response = participationService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tham gia sự kiện thành công", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ParticipationResponse>> create(
            @Valid @RequestBody CreateParticipationRequest request) {
        ParticipationResponse response = participationService.create(request);
        URI location = URI.create("/api/v1/admin/participations/" + response.id());
        return ResponseEntity.created(location)
                .body(ApiResponse.created("Tạo tham gia sự kiện thành công", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ParticipationResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateParticipationRequest request) {
        ParticipationResponse response = participationService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tham gia sự kiện thành công", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        participationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa tham gia sự kiện thành công", null));
    }
}
