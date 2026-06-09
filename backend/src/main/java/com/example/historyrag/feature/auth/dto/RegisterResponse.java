package com.example.historyrag.feature.auth.dto;

import com.example.historyrag.feature.user.Member;

import java.time.Instant;

public record RegisterResponse(
        Long id,
        String username,
        String email,
        String fullName,
        String status,
        Instant createdAt
) {
    public static RegisterResponse fromEntity(Member member) {
        return new RegisterResponse(
                member.getId(),
                member.getUsername(),
                member.getEmail(),
                member.getFullName(),
                member.getStatus(),
                member.getCreatedAt()
        );
    }
}
