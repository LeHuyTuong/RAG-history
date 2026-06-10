package com.example.historyrag.feature.user.dto;

import com.example.historyrag.feature.user.Member;

import java.time.Instant;

public record UserResponse(
        Long id,
        String username,
        String email,
        String fullName,
        Member.UserStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static UserResponse fromEntity(Member member) {
        return new UserResponse(
                member.getId(),
                member.getUsername(),
                member.getEmail(),
                member.getFullName(),
                member.getStatus(),
                member.getCreatedAt(),
                member.getUpdatedAt()
        );
    }
}