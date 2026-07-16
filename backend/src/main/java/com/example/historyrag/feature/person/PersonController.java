package com.example.historyrag.feature.person;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.person.dto.PersonRequest;
import com.example.historyrag.feature.person.dto.PersonResponse;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/admin/persons")
@RequiredArgsConstructor
public class PersonController {

    private final PersonService personService;

    @GetMapping
    public ResponseEntity<ApiResponse<ResultPaginationDTO>> getAllPersons(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @ParameterObject Pageable pageable) {
        ResultPaginationDTO result = personService.getAllPersons(keyword, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách nhân vật thành công", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PersonResponse>> getById(@PathVariable Long id) {
        PersonResponse response = personService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin nhân vật thành công", response));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<PersonResponse>> create(@Valid @RequestBody PersonRequest request) {
        PersonResponse response = personService.createPerson(request);
        URI location = URI.create("/api/v1/admin/persons/" + response.id());
        return ResponseEntity.created(location)
                .body(ApiResponse.created("Tạo nhân vật thành công", response));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PersonResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PersonRequest request) {
        PersonResponse response = personService.updatePerson(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật nhân vật thành công", response));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        personService.deletePerson(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa nhân vật thành công", null));
    }
}
