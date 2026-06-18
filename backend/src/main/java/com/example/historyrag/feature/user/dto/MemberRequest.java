package com.example.historyrag.feature.user.dto;

import com.example.historyrag.feature.user.Member;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MemberRequest(
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
        String username,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 255, message = "Email must not exceed 255 characters")
        String email,

        @Size(min = 8, max = 100, message = "Password must be 8-100 characters")
        String password,

        @Size(max = 255, message = "Full name must not exceed 255 characters")
        String fullName,

        @NotNull(message = "Status is required")
        Member.UserStatus status
) {
}
