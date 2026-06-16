package com.example.historyrag.feature.post;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.admin.Admin;
import com.example.historyrag.feature.admin.AdminRepository;
import com.example.historyrag.feature.event.Event;
import com.example.historyrag.feature.event.EventRepository;
import com.example.historyrag.feature.post.dto.CreatePostRequest;
import com.example.historyrag.feature.post.dto.PostFilterRequest;
import com.example.historyrag.feature.post.dto.PostResponse;
import com.example.historyrag.feature.post.dto.UpdatePostRequest;
import com.example.historyrag.feature.tag.Tag;
import com.example.historyrag.feature.tag.TagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.PredicateSpecification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceImplTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private AdminRepository adminRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private TagRepository tagRepository;

    private PostServiceImpl postService;

    @BeforeEach
    void setUp() {
        postService = new PostServiceImpl(postRepository, adminRepository, eventRepository, tagRepository);
    }

    @Test
    @DisplayName("Should create post with current admin and auto publishedAt when published")
    void create_validPublishedRequest_returnsPostResponse() {
        Admin admin = admin(1L);
        Event event = event(2L);
        Tag tag = tag(3L);
        CreatePostRequest request = createRequest(PostStatus.PUBLISHED, null, event.getId(), List.of(tag.getId()));

        when(postRepository.existsBySlug("chien-thang-bach-dang")).thenReturn(false);
        when(adminRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(tagRepository.findAllById(List.of(tag.getId()))).thenReturn(List.of(tag));
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> {
            Post saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        PostResponse response = postService.create(request, admin.getId());

        assertEquals(10L, response.id());
        assertEquals("Chiến thắng Bạch Đằng", response.title());
        assertEquals(PostStatus.PUBLISHED, response.status());
        assertNotNull(response.publishedAt());
        assertEquals(admin.getId(), response.author().id());
        assertEquals(event.getId(), response.event().id());
        assertEquals(1, response.tags().size());
    }

    @Test
    @DisplayName("Should reject create when slug already exists")
    void create_duplicateSlug_throwsDuplicateResourceException() {
        CreatePostRequest request = createRequest(PostStatus.DRAFT, null, null, List.of());
        when(postRepository.existsBySlug(request.slug())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> postService.create(request, 1L));

        verify(postRepository, never()).save(any(Post.class));
    }

    @Test
    @DisplayName("Should reject create when tag does not exist")
    void create_missingTag_throwsResourceNotFoundException() {
        Admin admin = admin(1L);
        CreatePostRequest request = createRequest(PostStatus.DRAFT, null, null, List.of(99L));
        when(postRepository.existsBySlug(request.slug())).thenReturn(false);
        when(adminRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(tagRepository.findAllById(List.of(99L))).thenReturn(List.of());

        assertThrows(ResourceNotFoundException.class, () -> postService.create(request, admin.getId()));

        verify(postRepository, never()).save(any(Post.class));
    }

    @Test
    @DisplayName("Should update post and keep requested publishedAt")
    void update_existingPost_returnsUpdatedPostResponse() {
        Post post = post(10L, admin(1L), null, List.of());
        Instant publishedAt = Instant.parse("2026-06-16T00:00:00Z");
        UpdatePostRequest request = updateRequest(post.getId(), "cap-nhat", PostStatus.PUBLISHED, publishedAt, null, List.of());

        when(postRepository.findById(post.getId())).thenReturn(Optional.of(post));
        when(postRepository.existsBySlugAndIdNot(request.slug(), request.id())).thenReturn(false);
        when(postRepository.save(post)).thenReturn(post);

        PostResponse response = postService.update(request);

        assertEquals("Tiêu đề cập nhật", response.title());
        assertEquals("cap-nhat", response.slug());
        assertEquals(PostStatus.PUBLISHED, response.status());
        assertEquals(publishedAt, response.publishedAt());
    }

    @Test
    @DisplayName("Should reject update when post does not exist")
    void update_missingPost_throwsResourceNotFoundException() {
        UpdatePostRequest request = updateRequest(404L, "missing", PostStatus.DRAFT, null, null, List.of());
        when(postRepository.findById(request.id())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> postService.update(request));
    }

    @Test
    @DisplayName("Should return post detail by id")
    void getById_existingPost_returnsPostResponse() {
        Post post = post(10L, admin(1L), event(2L), List.of(tag(3L)));
        when(postRepository.findById(post.getId())).thenReturn(Optional.of(post));

        PostResponse response = postService.getById(post.getId());

        assertEquals(post.getId(), response.id());
        assertEquals("chien-thang-bach-dang", response.slug());
        assertEquals(1, response.tags().size());
    }

    @Test
    @DisplayName("Should return ResultPaginationDTO when filtering posts")
    @SuppressWarnings({"unchecked", "rawtypes"})
    void filter_existingPosts_returnsPaginationDTO() {
        PageRequest pageable = PageRequest.of(0, 10);
        Post post = post(10L, admin(1L), null, List.of());
        PageImpl<Post> page = new PageImpl<>(List.of(post), pageable, 1);
        when(postRepository.findBy(any(PredicateSpecification.class), any(Function.class))).thenReturn(page);

        ResultPaginationDTO result = postService.filter(new PostFilterRequest("bach dang", null, null, null, null), pageable);

        assertEquals(1, result.meta().page());
        assertEquals(10, result.meta().pageSize());
        assertEquals(1, result.meta().total());
        assertEquals(1, result.result().size());
    }

    @Test
    @DisplayName("Should delete post when it exists")
    void delete_existingPost_deletesById() {
        when(postRepository.existsById(10L)).thenReturn(true);

        postService.delete(10L);

        verify(postRepository).deleteById(10L);
    }

    @Test
    @DisplayName("Should reject delete when post does not exist")
    void delete_missingPost_throwsResourceNotFoundException() {
        when(postRepository.existsById(404L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> postService.delete(404L));
    }

    @Test
    @DisplayName("Should save post with resolved event and tags")
    void create_validRelations_savesResolvedEntities() {
        Admin admin = admin(1L);
        Event event = event(2L);
        Tag tag = tag(3L);
        CreatePostRequest request = createRequest(PostStatus.DRAFT, null, event.getId(), List.of(tag.getId()));
        when(adminRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(tagRepository.findAllById(List.of(tag.getId()))).thenReturn(List.of(tag));
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> invocation.getArgument(0));

        postService.create(request, admin.getId());

        ArgumentCaptor<Post> captor = ArgumentCaptor.forClass(Post.class);
        verify(postRepository).save(captor.capture());
        assertEquals(event, captor.getValue().getEvent());
        assertEquals(List.of(tag), captor.getValue().getTags());
    }

    private CreatePostRequest createRequest(PostStatus status, Instant publishedAt, Long eventId, List<Long> tagIds) {
        return new CreatePostRequest(
                "Chiến thắng Bạch Đằng",
                "chien-thang-bach-dang",
                "Tóm tắt",
                "Nội dung",
                "/uploads/posts/bach-dang.jpg",
                status,
                publishedAt,
                eventId,
                tagIds
        );
    }

    private UpdatePostRequest updateRequest(Long id, String slug, PostStatus status, Instant publishedAt, Long eventId, List<Long> tagIds) {
        return new UpdatePostRequest(
                id,
                "Tiêu đề cập nhật",
                slug,
                "Tóm tắt mới",
                "Nội dung mới",
                "/uploads/posts/new.jpg",
                status,
                publishedAt,
                eventId,
                tagIds
        );
    }

    private Post post(Long id, Admin admin, Event event, List<Tag> tags) {
        Post post = new Post();
        post.setId(id);
        post.setAdmin(admin);
        post.setEvent(event);
        post.setTitle("Chiến thắng Bạch Đằng");
        post.setSlug("chien-thang-bach-dang");
        post.setSummary("Tóm tắt");
        post.setContent("Nội dung");
        post.setStatus(PostStatus.DRAFT);
        post.setTags(new ArrayList<>(tags));
        post.setCreatedAt(Instant.now());
        post.setUpdatedAt(Instant.now());
        return post;
    }

    private Admin admin(Long id) {
        Admin admin = new Admin();
        admin.setId(id);
        admin.setUsername("admin");
        admin.setEmail("admin@example.com");
        admin.setFullName("Admin Name");
        return admin;
    }

    private Event event(Long id) {
        Event event = new Event();
        event.setId(id);
        event.setName("Bạch Đằng");
        event.setSlug("bach-dang");
        return event;
    }

    private Tag tag(Long id) {
        Tag tag = new Tag();
        tag.setId(id);
        tag.setName("Nhà Trần");
        tag.setSlug("nha-tran");
        return tag;
    }
}
