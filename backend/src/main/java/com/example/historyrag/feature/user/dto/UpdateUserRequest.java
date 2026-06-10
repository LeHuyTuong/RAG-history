package com.example.historyrag.feature.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
        String username,
        @Size(min = 3, max = 50, message = "FullName must be 3-50 characters")
        String fullName
) {}