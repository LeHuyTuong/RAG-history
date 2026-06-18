package com.example.historyrag.feature.location;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.location.dto.CreateLocationRequest;
import com.example.historyrag.feature.location.dto.LocationFilterRequest;
import com.example.historyrag.feature.location.dto.LocationResponse;
import com.example.historyrag.feature.location.dto.UpdateLocationRequest;
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
@RequestMapping("/api/v1/admin/locations")
@PreAuthorize("hasRole('ADMIN')")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ResultPaginationDTO>> filter(
            @ParameterObject LocationFilterRequest filter,
            @ParameterObject Pageable pageable) {
        ResultPaginationDTO result = locationService.filter(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách địa danh thành công", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LocationResponse>> getById(@PathVariable Long id) {
        LocationResponse response = locationService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin địa danh thành công", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LocationResponse>> create(@Valid @RequestBody CreateLocationRequest request) {
        LocationResponse response = locationService.create(request);
        URI location = URI.create("/api/v1/admin/locations/" + response.id());
        return ResponseEntity.created(location)
                .body(ApiResponse.created("Tạo địa danh thành công", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LocationResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLocationRequest request) {
        LocationResponse response = locationService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật địa danh thành công", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        locationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa địa danh thành công", null));
    }
}
