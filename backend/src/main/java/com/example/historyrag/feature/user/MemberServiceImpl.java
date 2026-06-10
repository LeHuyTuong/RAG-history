package com.example.historyrag.feature.user;

import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.feature.user.dto.UpdateUserRequest;
import com.example.historyrag.feature.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class MemberServiceImpl implements MemberService {

    private static final Logger log = LoggerFactory.getLogger(MemberServiceImpl.class);

    private final MemberRepository memberRepository;

    @Override
    public UserResponse getUserById(Long id) {
        log.info("Getting user by id: {}", id);
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member", "id", id));
        return UserResponse.fromEntity(member);
    }

    @Override
    public UserResponse getUserByEmail(String email) {
        log.info("Getting user by email: {}", email);
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Member", "email", email));
        return UserResponse.fromEntity(member);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        log.info("Updating user with id: {}", id);

        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member", "id", id));
        if (request.username() != null && !request.username().isBlank()) {
            if (!request.username().equals(member.getUsername()) &&
                    memberRepository.existsByUsername(request.username())) {
                throw new InvalidRequestException("Username already exists");
            }
            member.setUsername(request.username());
        }
        if (request.fullName() != null) {
            member.setFullName(request.fullName());
        }

        member.setUpdatedAt(Instant.now());

        Member saved = memberRepository.save(member);
        log.info("User updated successfully: {}", saved.getId());

        return UserResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        log.info("Deleting user with id: {}", id);
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member", "id", id));
        member.setStatus(Member.UserStatus.INACTIVE);
        member.setUpdatedAt(Instant.now());
        memberRepository.save(member);
        log.info("User soft deleted: {}", id);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        log.info("Getting all active users");
        return memberRepository.findAll().stream()
                .filter(m -> Member.UserStatus.ACTIVE == m.getStatus())
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponse getCurrentUser() {
        log.info("Getting current authenticated user");

        var authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            String email = jwt.getSubject();

            if (email == null) {
                throw new InvalidRequestException("Cannot extract user email from token");
            }

            Member member = memberRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Member", "email", email));

            return UserResponse.fromEntity(member);
        }

        throw new InvalidRequestException("User not authenticated");
    }
}