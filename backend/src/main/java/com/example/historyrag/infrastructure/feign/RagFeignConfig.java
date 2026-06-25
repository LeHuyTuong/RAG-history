package com.example.historyrag.infrastructure.feign;

import com.fasterxml.jackson.databind.ObjectMapper;
import feign.Feign;
import feign.Request;
import feign.jackson.JacksonDecoder;
import feign.jackson.JacksonEncoder;
import feign.okhttp.OkHttpClient;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RagFeignConfig {

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper().findAndRegisterModules();
    }

    @Bean
    public RagFeignClient ragFeignClient(
            @Value("${app.rag.base-url}") String baseUrl,
            @Value("${app.rag.request-timeout:60s}") String requestTimeout,
            ObjectMapper objectMapper) {

        long timeoutSeconds = parseSeconds(requestTimeout);
        return Feign.builder()
                .client(new OkHttpClient())
                .encoder(new JacksonEncoder(objectMapper))
                .decoder(new JacksonDecoder(objectMapper))
                .requestInterceptor(new TraceparentInterceptor())
                .options(new Request.Options(
                        timeoutSeconds, TimeUnit.SECONDS,
                        timeoutSeconds, TimeUnit.SECONDS,
                        true))
                .target(RagFeignClient.class, baseUrl);
    }

    @Bean
    public RagClientService ragClientService(RagFeignClient ragFeignClient) {
        return new RagFeignClientAdapter(ragFeignClient);
    }

    private static long parseSeconds(String value) {
        if (value.endsWith("s")) return Long.parseLong(value.substring(0, value.length() - 1));
        if (value.endsWith("m")) return Long.parseLong(value.substring(0, value.length() - 1)) * 60;
        return Long.parseLong(value);
    }
}
