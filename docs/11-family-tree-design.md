# 11. Family Tree Design

## Mục tiêu

Family tree giúp hệ thống biểu diễn quan hệ gia phả và quan hệ lịch sử giữa các nhân vật. Neo4j phù hợp vì có thể query theo node và relationship.

## Node Neo4j

### Person

```text
Person:
- id
- name
- alias
- title
- birthYear
- deathYear
- description
```

Ví dụ:

```text
(:Person {
  id: "person-dinh-bo-linh",
  name: "Đinh Bộ Lĩnh",
  alias: "Đinh Tiên Hoàng",
  title: "Hoàng đế",
  birthYear: 924,
  deathYear: 979
})
```

### Dynasty

```text
Dynasty:
- id
- name
- startYear
- endYear
```

Ví dụ:

```text
(:Dynasty {
  id: "dynasty-dinh",
  name: "Nhà Đinh",
  startYear: 968,
  endYear: 980
})
```

### Place

```text
Place:
- id
- name
- currentName
- description
```

Ví dụ:

```text
(:Place {
  id: "place-hoa-lu",
  name: "Hoa Lư",
  currentName: "Ninh Bình",
  description: "Kinh đô của nhà Đinh và Tiền Lê"
})
```

### Event

```text
Event:
- id
- name
- year
- description
```

Ví dụ:

```text
(:Event {
  id: "event-loan-12-su-quan",
  name: "Loạn 12 sứ quân",
  year: 966,
  description: "Thời kỳ cát cứ sau khi Ngô Quyền mất"
})
```

## Relationships

Các relationship chính:

```text
(Person)-[:PARENT_OF]->(Person)
(Person)-[:SPOUSE_OF]->(Person)
(Person)-[:CHILD_OF]->(Person)
(Person)-[:SERVED_UNDER]->(Person)
(Person)-[:BORN_IN]->(Place)
(Person)-[:RULED]->(Dynasty)
(Person)-[:BELONGS_TO_DYNASTY]->(Dynasty)
(Person)-[:PARTICIPATED_IN]->(Event)
(Event)-[:HAPPENED_AT]->(Place)
```

## Metadata cho relationship

Mỗi relationship nên có metadata:

```text
- sourceId
- sourceType
- sourceTitle
- sourceUrl
- sourceDocumentId
- sourcePageNumber
- confidence
- note
```

Ví dụ:

```text
(dinhBoLinh)-[:PARENT_OF {
  sourceId: "source-001",
  sourceType: "ARTICLE",
  sourceTitle: "Gia phả nhà Đinh",
  sourceUrl: null,
  sourceDocumentId: null,
  sourcePageNumber: null,
  confidence: 0.9,
  note: "Quan hệ cha-con được ghi trong nguồn đã ingest"
}]->(dinhLien)
```

## Ví dụ Cypher

### Tìm con của Đinh Bộ Lĩnh

```cypher
MATCH (p:Person {name: "Đinh Bộ Lĩnh"})-[:PARENT_OF]->(child:Person)
RETURN child;
```

### Tìm cha/mẹ của một nhân vật

```cypher
MATCH (parent:Person)-[:PARENT_OF]->(p:Person {name: "Đinh Liễn"})
RETURN parent;
```

### Tìm người dưới trướng Đinh Bộ Lĩnh

```cypher
MATCH (subordinate:Person)-[:SERVED_UNDER]->(leader:Person {name: "Đinh Bộ Lĩnh"})
RETURN subordinate;
```

### Tìm triều đại một nhân vật cai trị

```cypher
MATCH (p:Person {name: "Đinh Bộ Lĩnh"})-[:RULED]->(d:Dynasty)
RETURN d;
```

### Tìm sự kiện một nhân vật tham gia

```cypher
MATCH (p:Person {name: "Đinh Bộ Lĩnh"})-[:PARTICIPATED_IN]->(e:Event)
RETURN e;
```

## Family tree response gợi ý

```json
{
  "person": {
    "id": "person-dinh-bo-linh",
    "name": "Đinh Bộ Lĩnh",
    "title": "Hoàng đế"
  },
  "parents": [],
  "spouses": [],
  "children": [
    {
      "id": "person-dinh-lien",
      "name": "Đinh Liễn",
      "relationship": "PARENT_OF"
    }
  ],
  "citations": [
    {
      "sourceType": "GRAPH",
      "relationship": "PARENT_OF",
      "source": "Đinh Bộ Lĩnh",
      "target": "Đinh Liễn",
      "evidenceSourceId": "source-001"
    }
  ]
}
```

## Lưu ý thiết kế

- `PARENT_OF` là relationship chính cho gia phả. `CHILD_OF` có thể suy ra ngược lại, không bắt buộc lưu cả hai nếu muốn tránh trùng dữ liệu.
- `SPOUSE_OF` thường là quan hệ hai chiều. Có thể tạo hai relationship hoặc query cả hai hướng.
- Tất cả relationship quan trọng nên có citation/evidence.
- Với dữ liệu tranh luận, dùng `confidence` và `note`.

