package com.example.historyrag.feature.user;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.user.dto.MemberRequest;
import com.example.historyrag.feature.user.dto.MemberResponse;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface MemberService {

    MemberResponse createMember(MemberRequest request);
    MemberResponse updateMember(Long id, MemberRequest request);
    void deleteMember(Long id);
    ResultPaginationDTO filterMembers(Pageable pageable, String search, String status);

    long countMembers();

    Optional<Member> findMemberByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    Member saveMember(Member member);
}
