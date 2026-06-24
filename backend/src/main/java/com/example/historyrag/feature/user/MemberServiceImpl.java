package com.example.historyrag.feature.user;

import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.user.dto.MemberRequest;
import com.example.historyrag.feature.user.dto.MemberResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public MemberResponse createMember(MemberRequest request) {
        if (request.password() == null || request.password().isBlank()) {
            throw new InvalidRequestException("Password is required");
        }
        if (memberRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Member", "username", request.username());
        }
        if (memberRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Member", "email", request.email());
        }

        Member member = new Member();
        applyRequest(member, request);
        member.setPasswordHash(passwordEncoder.encode(request.password()));
        return MemberResponse.fromEntity(memberRepository.save(member));
    }
    @Override
    @Transactional
    public MemberResponse updateMember(Long id, MemberRequest request) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member", "id", id));

        if (!member.getUsername().equals(request.username())
                && memberRepository.existsByUsernameAndIdNot(request.username(), id)) {
            throw new DuplicateResourceException("Member", "username", request.username());
        }
        if (!member.getEmail().equals(request.email())
                && memberRepository.existsByEmailAndIdNot(request.email(), id)) {
            throw new DuplicateResourceException("Member", "email", request.email());
        }

        applyRequest(member, request);
        if (request.password() != null && !request.password().isBlank()) {
            member.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        return MemberResponse.fromEntity(memberRepository.save(member));
    }
    @Override
    @Transactional
    public void deleteMember(Long id) {
        if (!memberRepository.existsById(id)) {
            throw new ResourceNotFoundException("Member", "id", id);
        }
        memberRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public long countMembers() {
        return memberRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Member> findMemberByEmail(String email) {
        return memberRepository.findByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return memberRepository.existsByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return memberRepository.existsByUsername(username);
    }

    @Override
    @Transactional
    public Member saveMember(Member member) {
        return memberRepository.save(member);
    }

    private void applyRequest(Member member, MemberRequest request) {
        member.setUsername(request.username());
        member.setEmail(request.email());
        member.setFullName(request.fullName());
        member.setStatus(request.status());
    }
}
