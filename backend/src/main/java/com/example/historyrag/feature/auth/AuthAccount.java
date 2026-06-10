package com.example.historyrag.feature.auth;

import com.example.historyrag.feature.admin.Admin;
import com.example.historyrag.feature.auth.dto.AuthUserResponse;
import com.example.historyrag.feature.user.Member;

record AuthAccount(
        Long id,
        String username,
        String email,
        String fullName,
        Member.UserStatus status,
        String accountType,
        String role,
        Admin admin,
        Member member
) {

    static final String ADMIN_ACCOUNT_TYPE = "ADMIN";
    static final String MEMBER_ACCOUNT_TYPE = "MEMBER";
    static final String ADMIN_ROLE = "ROLE_ADMIN";
    static final String MEMBER_ROLE = "ROLE_USER";

    static AuthAccount fromAdmin(Admin admin) {
        return new AuthAccount(
                admin.getId(),
                admin.getUsername(),
                admin.getEmail(),
                admin.getFullName(),
                admin.getStatus(),
                ADMIN_ACCOUNT_TYPE,
                ADMIN_ROLE,
                admin,
                null
        );
    }

    static AuthAccount fromMember(Member member) {
        return new AuthAccount(
                member.getId(),
                member.getUsername(),
                member.getEmail(),
                member.getFullName(),
                member.getStatus(),
                MEMBER_ACCOUNT_TYPE,
                MEMBER_ROLE,
                null,
                member
        );
    }

    AuthUserResponse toResponse() {
        return new AuthUserResponse(id, username, email, fullName, status, accountType, role, null);
    }
}
