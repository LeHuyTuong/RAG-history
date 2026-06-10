package com.example.historyrag.feature.auth.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken
) {
}
