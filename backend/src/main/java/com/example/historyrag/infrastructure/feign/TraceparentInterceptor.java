package com.example.historyrag.infrastructure.feign;

import feign.RequestInterceptor;
import feign.RequestTemplate;

public class TraceparentInterceptor implements RequestInterceptor {

    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    static void set(String value) {
        if (value != null && !value.isBlank()) {
            CURRENT.set(value);
        }
    }

    static void clear() {
        CURRENT.remove();
    }

    @Override
    public void apply(RequestTemplate template) {
        String value = CURRENT.get();
        if (value != null) {
            template.header("traceparent", value);
        }
    }
}
