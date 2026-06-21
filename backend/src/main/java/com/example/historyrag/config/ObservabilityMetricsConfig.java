package com.example.historyrag.config;

import com.faker.observability.core.metrics.EndpointSnapshot;
import com.faker.observability.core.metrics.MetricsCollector;
import com.faker.observability.core.trace.Span;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.DistributionSummary;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;
import io.micrometer.core.instrument.Timer;

import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ObservabilityMetricsConfig {

    @Bean
    MetricsCollector metricsCollector(MeterRegistry meterRegistry) {
        return new MicrometerMetricsCollector(meterRegistry);
    }

    private static final class MicrometerMetricsCollector implements MetricsCollector {

        private static final String UNKNOWN = "unknown";

        private final MeterRegistry meterRegistry;

        private MicrometerMetricsCollector(MeterRegistry meterRegistry) {
            this.meterRegistry = meterRegistry;
        }

        @Override
        public void recordSpan(Span span) {
            Tags tags = Tags.of(
                    "service", valueOrUnknown(span.serviceName()),
                    "protocol", span.protocol() == null ? UNKNOWN : span.protocol().name().toLowerCase(Locale.ROOT),
                    "operation", normalizeOperation(span.operation()),
                    "status", span.status() == null ? UNKNOWN : span.status().name().toLowerCase(Locale.ROOT));

            Counter.builder("historyrag.observability.span.count")
                    .description("Total spans recorded by the Viettel observability starter")
                    .tags(tags)
                    .register(meterRegistry)
                    .increment();

            Timer.builder("historyrag.observability.span.duration")
                    .description("Span duration recorded by the Viettel observability starter")
                    .tags(tags)
                    .register(meterRegistry)
                    .record(Math.max(span.durationMs(), 0), TimeUnit.MILLISECONDS);

            recordSize("historyrag.observability.span.request.size", span.requestSize(), tags);
            recordSize("historyrag.observability.span.response.size", span.responseSize(), tags);
        }

        @Override
        public List<EndpointSnapshot> endpointSnapshots() {
            return List.of();
        }

        private void recordSize(String metricName, long size, Tags tags) {
            DistributionSummary.builder(metricName)
                    .description("HTTP payload size recorded by the Viettel observability starter")
                    .baseUnit("bytes")
                    .tags(tags)
                    .register(meterRegistry)
                    .record(Math.max(size, 0));
        }

        private String normalizeOperation(String operation) {
            return valueOrUnknown(operation).replaceAll("/\\d+(?=/|$)", "/{id}");
        }

        private String valueOrUnknown(String value) {
            if (value == null || value.isBlank()) {
                return UNKNOWN;
            }
            return value;
        }
    }
}
