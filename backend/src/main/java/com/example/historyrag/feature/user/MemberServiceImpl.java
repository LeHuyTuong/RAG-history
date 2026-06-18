package com.example.historyrag.feature.user;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.feature.user.dto.MemberRequest;
import com.example.historyrag.feature.user.dto.MemberResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MemberServiceImpl implements MemberService {

    private static final Logger log = LoggerFactory.getLogger(MemberServiceImpl.class);

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    public MemberServiceImpl(MemberRepository memberRepository, PasswordEncoder passwordEncoder) {
        this.memberRepository = memberRepository;
        this.passwordEncoder = passwordEncoder;
    }
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
    private void applyRequest(Member member, MemberRequest request) {
        member.setUsername(request.username());
        member.setEmail(request.email());
        member.setFullName(request.fullName());
        member.setStatus(request.status());
    }
}
