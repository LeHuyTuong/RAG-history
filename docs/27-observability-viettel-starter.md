# 27. Tích hợp Viettel Java Foundation Observability Starter

## Vị trí starter

Repo local:

```text
/Users/lehuytuong/Documents/Dev/viettel-java-foundation
```

Module starter:

```text
observability-spring-boot-starter
```

Artifact dùng trong backend:

```xml
<dependency>
    <groupId>com.faker</groupId>
    <artifactId>observability-spring-boot-starter</artifactId>
    <version>0.1.0-SNAPSHOT</version>
</dependency>
```

## Build starter vào local Maven

Trước khi build History RAG backend trên máy mới, install starter:

```bash
cd /Users/lehuytuong/Documents/Dev/viettel-java-foundation
./mvnw -pl observability-spring-boot-starter -am install -DskipTests
```

## Lưu ý Spring Boot 4

History RAG dùng Spring Boot 4.0.6. Starter ban đầu có outbound `RestTemplateCustomizer` theo Boot 3, nhưng Boot 4 không còn class đó trong artifact hiện tại. Starter local đã được chỉnh để:

- Giữ inbound `TracingFilter`.
- Ghi span HTTP inbound vào `MetricsCollector`.
- Không auto-config outbound `RestTemplate` để tránh lỗi classpath.

Gateway SSE hiện forward `traceparent` từ request đầu vào sang FastAPI RAG qua `WebClient`. Khi cần tự động trace toàn bộ outbound call, kể cả request không có `traceparent` từ frontend, nên thêm WebClient filter riêng hoặc mở rộng starter bằng WebClient instrumentation.

## Cấu hình backend

Backend bật starter qua `application.yml`:

```yaml
observability:
  enabled: ${OBSERVABILITY_ENABLED:true}
  service-name: ${OBSERVABILITY_SERVICE_NAME:history-rag-backend}
  http:
    enabled: ${OBSERVABILITY_HTTP_ENABLED:true}
    inbound:
      enabled: ${OBSERVABILITY_HTTP_INBOUND_ENABLED:true}
```

Log pattern thêm MDC:

```yaml
logging:
  pattern:
    level: "%5p [${observability.service-name},%X{traceId},%X{spanId}]"
```

Mỗi HTTP response có header:

```text
traceparent: 00-<traceId>-<spanId>-01
```

## Metrics

Backend cung cấp bean `MetricsCollector` bridge sang Micrometer. Metric custom:

| Metric | Ý nghĩa |
|---|---|
| `historyrag.observability.span.count` | Tổng số span starter ghi nhận. |
| `historyrag.observability.span.duration` | Duration của span. |
| `historyrag.observability.span.request.size` | Request payload size. |
| `historyrag.observability.span.response.size` | Response payload size. |

Actuator expose:

```text
GET /actuator/health
GET /actuator/metrics
GET /actuator/metrics/historyrag.observability.span.duration
GET /actuator/prometheus
```

## Kiểm tra nhanh

Chạy backend, gọi health:

```bash
curl -i http://localhost:8080/actuator/health
```

Kiểm tra response có `traceparent`. `/actuator/health` được public; các endpoint metrics vẫn đi qua JWT. Sau đó xem metric:

```bash
curl -H "Authorization: Bearer <access-token>" \
  http://localhost:8080/actuator/metrics/historyrag.observability.span.count
```

Nếu dùng Prometheus:

```bash
curl -H "Authorization: Bearer <access-token>" \
  http://localhost:8080/actuator/prometheus | grep historyrag_observability
```

## Giới hạn hiện tại

- Starter mới đo HTTP inbound.
- Gateway RAG đã forward `traceparent` sang FastAPI nếu request đầu vào có header này.
- Chưa có WebClient instrumentation tổng quát cho mọi outbound call.
- Chưa tự lấy trace context do starter tạo ra để inject outbound khi frontend không gửi `traceparent`.
- Metric `operation` đã normalize path dạng `/123` thành `/{id}` để giảm cardinality, nhưng vẫn cần kiểm soát với URL động phức tạp.
