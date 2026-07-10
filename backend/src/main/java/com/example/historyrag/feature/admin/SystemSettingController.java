package com.example.historyrag.feature.admin;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.feature.admin.dto.SystemSettingRequest;
import com.example.historyrag.feature.admin.dto.SystemSettingResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingService systemSettingService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<SystemSettingResponse>>> getAll() {
        List<SystemSettingResponse> response = systemSettingService.getAll();
        return ResponseEntity.ok(ApiResponse.success("Lấy cấu hình hệ thống thành công", response));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{key}")
    public ResponseEntity<ApiResponse<SystemSettingResponse>> getByKey(@PathVariable String key) {
        SystemSettingResponse response = systemSettingService.getByKey(key);
        return ResponseEntity.ok(ApiResponse.success("Lấy cấu hình hệ thống thành công", response));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{key}")
    public ResponseEntity<ApiResponse<SystemSettingResponse>> upsert(
            @PathVariable String key,
            @Valid @RequestBody SystemSettingRequest request) {
        SystemSettingResponse response = systemSettingService.upsert(request.withKey(key));
        return ResponseEntity.ok(ApiResponse.success("Lưu cấu hình hệ thống thành công", response));
    }

}
