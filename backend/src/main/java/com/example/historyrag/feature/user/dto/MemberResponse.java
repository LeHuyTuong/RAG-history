package com.example.historyrag.feature.user.dto;

import com.example.historyrag.feature.user.Member;

import java.time.Instant;

public record MemberResponse(
        Long id,
        String username,
        String email,
        String fullName,
        Member.UserStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static MemberResponse fromEntity(Member member) {
        return new MemberResponse(
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
