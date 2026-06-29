package com.example.historyrag.infrastructure.feign;

import feign.RequestInterceptor;
import feign.RequestTemplate;

public class RagApiKeyInterceptor implements RequestInterceptor {

    private final String apiKey;

    public RagApiKeyInterceptor(String apiKey) {
        this.apiKey = apiKey;
    }

    @Override
    public void apply(RequestTemplate template) {
        if (apiKey != null && !apiKey.isBlank()) {
            template.header("X-Rag-Api-Key", apiKey);
        }
    }
}