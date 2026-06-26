package com.example.historyrag.feature.event;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.event.dto.CreateEventRequest;
import com.example.historyrag.feature.event.dto.EventFilterRequest;
import com.example.historyrag.feature.event.dto.EventResponse;
import com.example.historyrag.feature.event.dto.UpdateEventRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/v1/admin/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<ApiResponse<ResultPaginationDTO>> filter(
            @ParameterObject EventFilterRequest filter,
            @ParameterObject Pageable pageable) {
        ResultPaginationDTO result = eventService.filter(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách sự kiện thành công", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventResponse>> getById(@PathVariable Long id) {
        EventResponse response = eventService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin sự kiện thành công", response));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<EventResponse>> create(@Valid @RequestBody CreateEventRequest request) {
        EventResponse response = eventService.create(request);
        URI location = URI.create("/api/v1/admin/events/" + response.id());
        return ResponseEntity.created(location)
                .body(ApiResponse.created("Tạo sự kiện thành công", response));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EventResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEventRequest request) {
        EventResponse response = eventService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật sự kiện thành công", response));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        eventService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa sự kiện thành công", null));
    }
}
