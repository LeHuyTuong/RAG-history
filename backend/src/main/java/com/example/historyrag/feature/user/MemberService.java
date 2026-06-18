package com.example.historyrag.feature.user;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.user.dto.MemberRequest;
import com.example.historyrag.feature.user.dto.MemberResponse;
import org.springframework.data.domain.Pageable;

public interface MemberService {

    MemberResponse createMember(MemberRequest request);
    MemberResponse updateMember(Long id, MemberRequest request);
    void deleteMember(Long id);
}
