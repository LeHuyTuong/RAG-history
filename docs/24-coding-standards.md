# 24. Coding Standards

> Cheat-sheet quy ước code cho backend **Spring Boot 4 (Java 25)** và **RESTful API**. Áp dụng cho toàn team. Mỗi quy tắc có ví dụ ✅ DO / ❌ DON'T.

---

## PHẦN 1 — JAVA / SPRING BOOT NAMING & VARIABLES

### 1.1 Quy tắc chung

| Loại | Convention | Ví dụ |
|---|---|---|
| **Class / Interface / Enum** | `PascalCase` | `PostService`, `EventRepository` |
| **Method / biến local / tham số** | `camelCase` | `findBySlug`, `postId`, `pageSize` |
| **Hằng số** | `UPPER_SNAKE_CASE` | `MAX_CHUNK_SIZE`, `DEFAULT_TOP_K` |
| **Package** | `lowercase`, `dot-separated` | `com.example.historyrag.module.post` |
| **Generic type** | 1 chữ hoa: `T`, `K`, `V`, `E` | `Optional<T>`, `List<E>` |

---

### 1.2 Đặt tên Class theo Layer Spring

```
PostController          ← Controller (xử lý HTTP)
PostService             ← Interface service
PostServiceImpl         ← Implement của interface
PostRepository          ← Spring Data JPA repo
Post                    ← Entity JPA
CreatePostRequest       ← DTO đầu vào
PostResponse            ← DTO đầu ra
PostMapper              ← MapStruct / thủ công
PostNotFoundException   ← Custom exception
RagConfig               ← @Configuration bean
```

✅ DO — đặt tên layer rõ ràng:
```java
public class PostController { ... }
public interface PostService { ... }
public class PostServiceImpl implements PostService { ... }
public interface PostRepository extends JpaRepository<Post, Long> { ... }
```

❌ DON'T — tên mơ hồ hoặc trộn lẫn:
```java
public class PostManager { ... }   // "Manager" không rõ layer
public class PostData { ... }      // "Data" mơ hồ — Entity hay DTO?
public class Post2 { ... }         // Đánh số
```

---

### 1.3 Đặt tên Boolean

✅ DO — dùng prefix `is` / `has` / `can`:
```java
boolean isPublished;
boolean hasContent;
boolean canEdit;
boolean isRevoked;
```

❌ DON'T — tên không gợi bool:
```java
boolean published;    // đọc như noun, không rõ true/false
boolean status;       // quá mơ hồ
boolean flag;         // vô nghĩa
```

---

### 1.4 Tên biến có ý nghĩa — tránh viết tắt

✅ DO:
```java
List<Post> publishedPosts = postRepository.findByStatus(PostStatus.PUBLISHED);
long eventId = event.getEventId();
int chunkOverlap = settings.getChunkOverlap();
```

❌ DON'T:
```java
List<Post> lst = postRepository.findByStatus(PostStatus.PUBLISHED);
long id2 = event.getEventId();   // id2 — id của cái gì?
int co = settings.getChunkOverlap();  // "co" không ai hiểu
```

---

### 1.5 Khai báo biến

**Dùng `final` cho biến không đổi sau khi gán:**
```java
// ✅ DO
final String slug = SlugUtils.toSlug(title);
final Post post = postRepository.findById(id).orElseThrow();

// ❌ DON'T — khai var rồi không bao giờ gán lại nhưng không final
String slug = SlugUtils.toSlug(title);
```

**`var` (Java 10+) — dùng khi kiểu rõ ràng từ vế phải:**
```java
// ✅ DO — kiểu rõ
var posts = postRepository.findAll();          // rõ là List<Post>
var response = new PostResponse(post);         // rõ là PostResponse

// ❌ DON'T — kiểu không rõ, gây khó đọc
var result = postService.process(request);     // process() trả cái gì?
```

**Thu hẹp scope — khai biến gần chỗ dùng:**
```java
// ✅ DO
public PostResponse createPost(CreatePostRequest request) {
    final Post post = mapper.toEntity(request);
    postRepository.save(post);
    final String slug = post.getSlug();        // khai sát chỗ cần
    eventPublisher.publish(new PostCreatedEvent(slug));
    return mapper.toResponse(post);
}
```

**Tránh magic number — đặt hằng số hoặc enum:**
```java
// ✅ DO
private static final int MAX_TITLE_LENGTH = 500;
private static final int DEFAULT_PAGE_SIZE = 20;

if (title.length() > MAX_TITLE_LENGTH) { ... }

// ❌ DON'T
if (title.length() > 500) { ... }
if (page > 99) { ... }
```

**`Optional` thay vì trả `null`:**
```java
// ✅ DO
public Optional<Post> findBySlug(String slug) {
    return postRepository.findBySlug(slug);
}

// ✅ DO — xử lý ở caller
Post post = postService.findBySlug(slug)
    .orElseThrow(() -> new PostNotFoundException(slug));

// ❌ DON'T
public Post findBySlug(String slug) {
    return postRepository.findBySlug(slug); // trả null nếu không có
}
```

---

### 1.6 Package structure

```
com.example.historyrag
├── common/              ← exception, util, base class dùng chung
├── config/              ← SecurityConfig, WebConfig, RagConfig...
└── module/
    ├── post/
    │   ├── Post.java                  ← Entity
    │   ├── PostController.java
    │   ├── PostService.java           ← Interface
    │   ├── PostServiceImpl.java
    │   ├── PostRepository.java
    │   ├── dto/
    │   │   ├── CreatePostRequest.java
    │   │   └── PostResponse.java
    │   └── PostMapper.java
    ├── event/
    ├── person/
    └── rag/
```

---

## PHẦN 2 — REST API DESIGN

### 2.1 Đặt tên URL (Resource)

| Quy tắc | ✅ DO | ❌ DON'T |
|---|---|---|
| Dùng **danh từ số nhiều** | `/posts` | `/post`, `/getPost` |
| **lowercase + kebab-case** | `/event-sources` | `/eventSources`, `/EventSources` |
| **Không có động từ** trên URL | `DELETE /posts/{id}` | `/deletePost/{id}` |
| Lồng khi biểu thị quan hệ sở hữu | `/posts/{id}/tags` | `/getTagsByPostId` |
| Tránh lồng sâu > 2 cấp | `/events/{id}/persons` | `/events/{id}/participations/{pid}/persons/{nid}` |

✅ DO:
```
GET    /api/v1/posts
GET    /api/v1/posts/{id}
POST   /api/v1/posts
PUT    /api/v1/posts/{id}
PATCH  /api/v1/posts/{id}
DELETE /api/v1/posts/{id}
GET    /api/v1/posts/{id}/tags
GET    /api/v1/events/{id}/participations
```

❌ DON'T:
```
GET  /api/v1/getPost
POST /api/v1/createNewPost
GET  /api/v1/post_list
GET  /api/v1/posts/{postId}/tags/{tagId}/subtags/{subId}/items
```

---

### 2.2 HTTP Method & Idempotency

| Method | Dùng cho | Idempotent? | Body? |
|---|---|---|---|
| `GET` | Đọc tài nguyên | ✅ | ❌ |
| `POST` | Tạo mới | ❌ | ✅ |
| `PUT` | Thay thế toàn bộ (ghi đè) | ✅ | ✅ |
| `PATCH` | Cập nhật một phần | ❌ | ✅ |
| `DELETE` | Xóa | ✅ | ❌ |

✅ DO:
```java
@GetMapping("/posts/{id}")          // chỉ đọc
@PostMapping("/posts")              // tạo mới
@PutMapping("/posts/{id}")          // cập nhật toàn bộ
@PatchMapping("/posts/{id}")        // cập nhật 1 phần (vd: chỉ đổi status)
@DeleteMapping("/posts/{id}")       // xóa
```

❌ DON'T:
```java
@PostMapping("/posts/update/{id}")  // update bằng POST — sai method
@GetMapping("/posts/delete/{id}")   // delete bằng GET — nguy hiểm
```

---

### 2.3 HTTP Status Code

| Code | Khi nào dùng |
|---|---|
| `200 OK` | GET/PUT/PATCH thành công, trả body |
| `201 Created` | POST tạo thành công; kèm header `Location: /posts/{id}` |
| `204 No Content` | DELETE thành công (không có body) |
| `400 Bad Request` | Sai format request, validation lỗi |
| `401 Unauthorized` | Chưa đăng nhập / token không hợp lệ |
| `403 Forbidden` | Đã đăng nhập nhưng không có quyền |
| `404 Not Found` | Tài nguyên không tồn tại |
| `409 Conflict` | Trùng lặp (vd: email đã dùng, slug đã có) |
| `422 Unprocessable Entity` | Đúng format nhưng logic không hợp lệ |
| `500 Internal Server Error` | Lỗi không ngờ phía server |

✅ DO:
```java
// Tạo post thành công
return ResponseEntity.status(HttpStatus.CREATED)
    .header("Location", "/api/v1/posts/" + post.getPostId())
    .body(response);

// Xóa thành công
return ResponseEntity.noContent().build();  // 204

// Không tìm thấy → ném exception, @ControllerAdvice xử lý → 404
throw new PostNotFoundException(id);
```

❌ DON'T:
```java
// Luôn trả 200 kể cả khi lỗi
return ResponseEntity.ok("Error: not found");

// Trả 200 khi tạo mới
return ResponseEntity.ok(newPost);  // nên là 201
```

---

### 2.4 Cấu trúc JSON Response nhất quán

Dùng **camelCase** cho key JSON (Java convention → Jackson tự convert).

✅ DO — response thành công:
```json
{
  "postId": 12,
  "title": "Trận Bạch Đằng 1288",
  "slug": "tran-bach-dang-1288",
  "status": "PUBLISHED",
  "publishedAt": "2025-06-01T10:00:00Z",
  "author": {
    "adminId": 1,
    "fullName": "Nguyễn Admin"
  }
}
```

✅ DO — response danh sách có phân trang:
```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8,
  "last": false
}
```

❌ DON'T — key không nhất quán:
```json
{
  "post_id": 12,        // snake_case lẫn camelCase
  "Title": "...",       // PascalCase
  "published": "yes"    // dùng chuỗi cho trường bool/enum
}
```

---

### 2.5 Query Param: phân trang, lọc, sắp xếp

✅ DO:
```
GET /api/v1/posts?page=0&size=20&sort=publishedAt,desc
GET /api/v1/posts?status=PUBLISHED&tagId=3
GET /api/v1/events?periodId=5&certaintyLevel=CERTAIN
GET /api/v1/persons?name=Trần
```

❌ DON'T:
```
GET /api/v1/posts/page/0/size/20      // phân trang trong path
GET /api/v1/posts/filter/published    // action trong URL
```

---

### 2.6 Định dạng lỗi chuẩn (RFC 7807 Problem JSON)

Mọi lỗi trả về **cùng một cấu trúc** — xử lý tập trung qua `@ControllerAdvice`.

✅ DO — response lỗi:
```json
{
  "type": "https://history-rag.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Post với slug 'xyz' không tồn tại",
  "instance": "/api/v1/posts/xyz",
  "timestamp": "2025-06-01T10:05:00Z"
}
```

✅ DO — validation error (400):
```json
{
  "type": "https://history-rag.example.com/errors/validation",
  "title": "Validation Failed",
  "status": 400,
  "detail": "Dữ liệu đầu vào không hợp lệ",
  "errors": [
    { "field": "title", "message": "Title không được để trống" },
    { "field": "content", "message": "Content phải có ít nhất 100 ký tự" }
  ]
}
```

✅ DO — `@ControllerAdvice` xử lý tập trung:
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PostNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(PostNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.notFound(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<FieldError> errors = ex.getBindingResult().getFieldErrors()
            .stream().map(e -> new FieldError(e.getField(), e.getDefaultMessage()))
            .toList();
        return ResponseEntity.badRequest()
            .body(ErrorResponse.validationFailed(errors));
    }
}
```

❌ DON'T — xử lý lỗi rải rác trong từng controller:
```java
try {
    return postService.findById(id);
} catch (Exception e) {
    return ResponseEntity.status(500).body("Lỗi rồi: " + e.getMessage());
}
```

---

### 2.7 Versioning API

Dùng **version trong URL path** — đơn giản, rõ ràng, dễ maintain cho đồ án:

✅ DO:
```
/api/v1/posts
/api/v1/events
/api/v1/rag/chat
```

❌ DON'T — không có version:
```
/api/posts       // sau này thêm breaking change sẽ khó
```

---

### 2.8 Lưu ý bảo mật cơ bản

| Quy tắc | Áp dụng |
|---|---|
| **Không lộ stack trace** trong response lỗi production | `GlobalExceptionHandler` chỉ trả message chung cho lỗi 500 |
| **Validate đầu vào** bằng `@Valid` + Bean Validation | `@NotBlank`, `@Size`, `@Min`... trên DTO |
| **Không lộ thông tin nhạy cảm** trong response | Không trả `password_hash`, không trả toàn bộ entity (dùng DTO) |
| **Rate limit / pagination** bắt buộc | Không cho phép `size=10000` |
| **CORS** khai rõ origin | Không để `allowedOrigins("*")` trên môi trường production |

✅ DO — DTO validation:
```java
public record CreatePostRequest(
    @NotBlank(message = "Title không được để trống")
    @Size(max = 500, message = "Title tối đa 500 ký tự")
    String title,

    @NotBlank(message = "Content không được để trống")
    String content,

    Long eventId   // nullable — chưa gắn event cũng được
) {}
```

✅ DO — giới hạn page size:
```java
@GetMapping("/posts")
public Page<PostResponse> getPosts(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") @Max(100) int size
) { ... }
```

---

## Tóm tắt nhanh (1 trang)

```
JAVA NAMING
  PascalCase   → Class, Interface, Enum
  camelCase    → method, biến, tham số
  UPPER_SNAKE  → hằng số
  lowercase    → package

SPRING LAYER SUFFIX
  XxxController / XxxService / XxxServiceImpl
  XxxRepository / XxxEntity (hoặc chỉ Xxx)
  CreateXxxRequest / XxxResponse / XxxMapper
  XxxNotFoundException / XxxConfig

BIẾN
  final        → mọi biến không đổi sau gán
  Optional<T>  → thay vì trả null
  var          → ok nếu kiểu rõ từ vế phải
  const/enum   → thay magic number

REST URL
  /api/v1/{resource-plural}            danh từ số nhiều, lowercase
  GET/POST/PUT/PATCH/DELETE            đúng method
  201 + Location khi tạo mới          không 200 khi POST
  204 khi xóa                         không 200 với body rỗng

JSON
  camelCase key                        không snake_case
  body lỗi nhất quán (RFC 7807)        không chuỗi lỗi ngẫu nhiên
  @ControllerAdvice tập trung          không try/catch trong controller
```
