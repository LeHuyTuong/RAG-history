package com.example.historyrag.feature.post;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.GlobalExceptionHandler;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.post.dto.CreatePostRequest;
import com.example.historyrag.feature.post.dto.PostFilterRequest;
import com.example.historyrag.feature.post.dto.PostResponse;
import com.example.historyrag.feature.post.dto.UpdatePostRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class PostControllerTest {

    @Mock
    private PostService postService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        PostController controller = new PostController(postService);
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(
                        new PageableHandlerMethodArgumentResolver(),
                        new JwtArgumentResolver())
                .setValidator(validator)
                .build();
    }

    @Test
    @DisplayName("Should return paginated posts wrapped in ApiResponse")
    void filter_existingPosts_returnsResultPagination() throws Exception {
        ResultPaginationDTO result = new ResultPaginationDTO(
                new ResultPaginationDTO.Meta(1, 10, 1, 1),
                List.of(postResponse())
        );
        when(postService.filter(any(PostFilterRequest.class), any(PageRequest.class))).thenReturn(result);

        mockMvc.perform(get("/api/v1/admin/posts")
                        .param("keyword", "bach")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Lấy danh sách bài viết thành công"))
                .andExpect(jsonPath("$.data.meta.page").value(1))
                .andExpect(jsonPath("$.data.result[0].slug").value("chien-thang-bach-dang"));
    }

    @Test
    @DisplayName("Should return post detail wrapped in ApiResponse")
    void getById_existingPost_returnsPostResponse() throws Exception {
        when(postService.getById(10L)).thenReturn(postResponse());

        mockMvc.perform(get("/api/v1/admin/posts/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Lấy thông tin bài viết thành công"))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.author.id").value(1));
    }

    @Test
    @DisplayName("Should return not found when post does not exist")
    void getById_missingPost_returnsNotFound() throws Exception {
        when(postService.getById(404L)).thenThrow(new ResourceNotFoundException("Bài viết", "id", 404L));

        mockMvc.perform(get("/api/v1/admin/posts/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.statusCode").value(404))
                .andExpect(jsonPath("$.message", containsString("Bài viết")));
    }

    @Test
    @DisplayName("Should create post with current admin id from JWT")
    void create_validRequest_returnsCreated() throws Exception {
        when(postService.create(any(CreatePostRequest.class), eq(1L))).thenReturn(postResponse());

        mockMvc.perform(post("/api/v1/admin/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Chiến thắng Bạch Đằng",
                                  "slug":"chien-thang-bach-dang",
                                  "summary":"Tóm tắt",
                                  "content":"Nội dung",
                                  "status":"PUBLISHED",
                                  "eventId":2,
                                  "tagIds":[3]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/admin/posts/10"))
                .andExpect(jsonPath("$.statusCode").value(201))
                .andExpect(jsonPath("$.message").value("Tạo bài viết thành công"))
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"));
    }

    @Test
    @DisplayName("Should return validation error when create request is invalid")
    void create_invalidRequest_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/admin/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"","slug":"Invalid Slug"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.details", hasItem(containsString("title"))));

        verify(postService, never()).create(any(), any());
    }

    @Test
    @DisplayName("Should return conflict when create slug already exists")
    void create_duplicateSlug_returnsConflict() throws Exception {
        when(postService.create(any(CreatePostRequest.class), eq(1L)))
                .thenThrow(new DuplicateResourceException("Bài viết", "slug", "chien-thang-bach-dang"));

        mockMvc.perform(post("/api/v1/admin/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Chiến thắng Bạch Đằng","slug":"chien-thang-bach-dang"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.statusCode").value(409))
                .andExpect(jsonPath("$.message", containsString("slug")));
    }

    @Test
    @DisplayName("Should update post from request body id")
    void update_validRequest_returnsPostResponse() throws Exception {
        when(postService.update(any(UpdatePostRequest.class))).thenReturn(postResponse());

        mockMvc.perform(put("/api/v1/admin/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id":10,
                                  "title":"Chiến thắng Bạch Đằng",
                                  "slug":"chien-thang-bach-dang",
                                  "status":"PUBLISHED"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Cập nhật bài viết thành công"))
                .andExpect(jsonPath("$.data.id").value(10));
    }

    @Test
    @DisplayName("Should return validation error when update id is missing")
    void update_missingId_returnsBadRequest() throws Exception {
        mockMvc.perform(put("/api/v1/admin/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Chiến thắng Bạch Đằng","slug":"chien-thang-bach-dang","status":"DRAFT"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.details[0]", containsString("id")));
    }

    @Test
    @DisplayName("Should delete post by id")
    void delete_existingPost_returnsSuccess() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/posts/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Xóa bài viết thành công"));

        verify(postService).delete(10L);
    }

    private PostResponse postResponse() {
        return new PostResponse(
                10L,
                "Chiến thắng Bạch Đằng",
                "chien-thang-bach-dang",
                "Tóm tắt",
                "Nội dung",
                "/uploads/posts/bach-dang.jpg",
                PostStatus.PUBLISHED,
                Instant.parse("2026-06-16T00:00:00Z"),
                new PostResponse.AuthorResponse(1L, "admin", "Admin Name", "admin@example.com"),
                new PostResponse.EventResponse(2L, "Bạch Đằng", "bach-dang"),
                List.of(new PostResponse.TagResponse(3L, "Nhà Trần", "nha-tran")),
                Instant.parse("2026-06-16T00:00:00Z"),
                Instant.parse("2026-06-16T01:00:00Z")
        );
    }

    private static class JwtArgumentResolver implements HandlerMethodArgumentResolver {

        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                    && Jwt.class.isAssignableFrom(parameter.getParameterType());
        }

        @Override
        public Object resolveArgument(MethodParameter parameter,
                ModelAndViewContainer mavContainer,
                NativeWebRequest webRequest,
                WebDataBinderFactory binderFactory) {
            return new Jwt(
                    "access-token",
                    Instant.now(),
                    Instant.now().plusSeconds(60),
                    Map.of("alg", "HS512"),
                    Map.of(
                            "sub", "admin@example.com",
                            "accountType", "ADMIN",
                            "userId", 1L
                    )
            );
        }
    }
}
