package com.example.historyrag.feature.user;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.user.dto.MemberRequest;
import com.example.historyrag.feature.user.dto.MemberResponse;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/admin/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MemberResponse>> create(@Valid @RequestBody MemberRequest request) {
        MemberResponse response = memberService.createMember(request);
        URI location = URI.create("/api/v1/admin/members/" + response.id());
        return ResponseEntity.created(location)
                .body(ApiResponse.created("Tạo thành viên thành công", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MemberResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody MemberRequest request) {
        MemberResponse response = memberService.updateMember(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành viên thành công", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        memberService.deleteMember(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành viên thành công", null));
    }
}
