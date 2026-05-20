# 14. Citation Source Tracking

## Mục tiêu

Chatbot lịch sử phải trả lời có nguồn. Citation giúp người dùng biết câu trả lời dựa trên tài liệu nào, bài viết nào, URL nào hoặc quan hệ graph nào.

Không nên chỉ trả câu trả lời dạng văn bản thuần. Mỗi assistant message nên có `citations`.

## Nguyên tắc citation

- Mỗi chunk trong Qdrant phải có metadata nguồn.
- Mỗi relationship trong Neo4j nên có evidence/source metadata.
- RAG service trả citations về Spring Boot.
- Spring Boot lưu citations vào `chat_messages.citations_json`.
- Frontend hiển thị citations dưới assistant message.

## PDF citation

Ví dụ citation từ PDF:

```json
{
  "sourceType": "DOCUMENT",
  "fileName": "Lich-su-Viet-Nam.pdf",
  "pageNumber": 45,
  "chunkIndex": 8
}
```

Mở rộng khuyến nghị:

```json
{
  "sourceType": "DOCUMENT",
  "sourceId": "source-001",
  "documentId": 10,
  "title": "Lịch sử Việt Nam",
  "fileName": "Lich-su-Viet-Nam.pdf",
  "pageNumber": 45,
  "chunkIndex": 8,
  "score": 0.84
}
```

## Article citation

Ví dụ citation từ bài viết:

```json
{
  "sourceType": "ARTICLE",
  "articleId": 12,
  "title": "Đinh Bộ Lĩnh và loạn 12 sứ quân",
  "slug": "dinh-bo-linh-loan-12-su-quan"
}
```

Mở rộng khuyến nghị:

```json
{
  "sourceType": "ARTICLE",
  "sourceId": "source-article-12",
  "articleId": 12,
  "title": "Đinh Bộ Lĩnh và loạn 12 sứ quân",
  "slug": "dinh-bo-linh-loan-12-su-quan",
  "categoryName": "Nhà Đinh",
  "chunkIndex": 2,
  "score": 0.79
}
```

## URL/Wiki citation

Ví dụ citation từ URL/Wiki:

```json
{
  "sourceType": "URL",
  "title": "Đinh Tiên Hoàng",
  "sourceUrl": "https://...",
  "chunkIndex": 3
}
```

Mở rộng khuyến nghị:

```json
{
  "sourceType": "URL",
  "sourceId": "source-url-001",
  "title": "Đinh Tiên Hoàng",
  "sourceUrl": "https://...",
  "chunkIndex": 3,
  "lastIngestedAt": "2026-05-20T10:00:00",
  "score": 0.81
}
```

## Manual input citation

```json
{
  "sourceType": "MANUAL_INPUT",
  "sourceId": "source-manual-001",
  "title": "Ghi chú về Hoa Lư",
  "chunkIndex": 0,
  "createdBy": "admin"
}
```

## Graph citation

Ví dụ citation từ Neo4j:

```json
{
  "sourceType": "GRAPH",
  "relationship": "PARENT_OF",
  "source": "Đinh Bộ Lĩnh",
  "target": "Đinh Liễn",
  "evidenceSourceId": "source-001"
}
```

Mở rộng khuyến nghị:

```json
{
  "sourceType": "GRAPH",
  "relationship": "PARENT_OF",
  "source": "Đinh Bộ Lĩnh",
  "target": "Đinh Liễn",
  "evidenceSourceId": "source-001",
  "sourceTitle": "Gia phả nhà Đinh",
  "sourceUrl": null,
  "sourceDocumentId": null,
  "sourcePageNumber": null,
  "confidence": 0.9,
  "note": "Quan hệ được nhập từ nguồn đã kiểm tra"
}
```

## Citation trong chat message

`chat_messages.citations_json` lưu list citation:

```json
[
  {
    "sourceType": "ARTICLE",
    "articleId": 12,
    "title": "Đinh Bộ Lĩnh và loạn 12 sứ quân",
    "slug": "dinh-bo-linh-loan-12-su-quan",
    "chunkIndex": 2
  },
  {
    "sourceType": "GRAPH",
    "relationship": "PARENT_OF",
    "source": "Đinh Bộ Lĩnh",
    "target": "Đinh Liễn",
    "evidenceSourceId": "source-001"
  }
]
```

## Frontend hiển thị citation

Gợi ý hiển thị:

- PDF: `Lich-su-Viet-Nam.pdf, trang 45`.
- Article: link đến bài viết.
- URL/Wiki: title + external link.
- Graph: `Đinh Bộ Lĩnh --PARENT_OF--> Đinh Liễn`, kèm evidence nếu có.

Không cần hiển thị `chunkIndex` cho user thường nếu làm UI đơn giản, nhưng nên giữ trong dữ liệu để debug.

## Khi thiếu nguồn

Nếu retrieval không tìm được nguồn đủ tốt:

- Chatbot không nên trả lời chắc chắn.
- Nên nói dữ liệu trong hệ thống chưa đủ.
- Có thể gợi ý admin bổ sung tài liệu hoặc nguồn.

Ví dụ:

```text
Hiện tại dữ liệu trong hệ thống chưa đủ nguồn để trả lời chắc chắn câu hỏi này.
```

