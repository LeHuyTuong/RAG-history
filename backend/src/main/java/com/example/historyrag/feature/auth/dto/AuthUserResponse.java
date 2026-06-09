package com.example.historyrag.feature.auth.dto;

import com.example.historyrag.feature.admin.Admin;
import com.example.historyrag.feature.user.Member;

import java.time.Instant;

public record AuthUserResponse(
        Long id,
        String username,
        String email,
        String fullName,
        String status,
        String accountType,
        String role,
        Instant createdAt
) {

    public static AuthUserResponse fromAdmin(Admin admin) {
        return new AuthUserResponse(
                admin.getId(),
                admin.getUsername(),
                admin.getEmail(),
                admin.getFullName(),
                admin.getStatus(),
                "ADMIN",
                "ROLE_ADMIN",
                admin.getCreatedAt()
        );
    }

    public static AuthUserResponse fromMember(Member member) {
        return new AuthUserResponse(
                member.getId(),
                member.getUsername(),
                member.getEmail(),
                member.getFullName(),
                member.getStatus(),
                "MEMBER",
                "ROLE_USER",
                member.getCreatedAt()
        );
    }
}
