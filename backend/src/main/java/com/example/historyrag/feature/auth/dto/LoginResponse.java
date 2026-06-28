package com.example.historyrag.feature.auth.dto;


import lombok.Builder;
@Builder
public record LoginResponse(
        String accessToken,
        String refreshToken
) {
}
