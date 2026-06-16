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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final AdminRepository adminRepository;
    private final EventRepository eventRepository;
    private final TagRepository tagRepository;

    public PostServiceImpl(PostRepository postRepository,
            AdminRepository adminRepository,
            EventRepository eventRepository,
            TagRepository tagRepository) {
        this.postRepository = postRepository;
        this.adminRepository = adminRepository;
        this.eventRepository = eventRepository;
        this.tagRepository = tagRepository;
    }

    @Override
    @Transactional
    public PostResponse create(CreatePostRequest request, Long adminId) {
        if (postRepository.existsBySlug(request.slug())) {
            throw new DuplicateResourceException("Bài viết", "slug", request.slug());
        }

        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Quản trị viên", "id", adminId));

        Post post = new Post();
        post.setAdmin(admin);
        applyCreateRequest(post, request);

        return PostResponse.fromEntity(postRepository.save(post));
    }

    @Override
    @Transactional
    public PostResponse update(UpdatePostRequest request) {
        Post post = postRepository.findById(request.id())
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết", "id", request.id()));

        if (!post.getSlug().equals(request.slug()) && postRepository.existsBySlugAndIdNot(request.slug(), request.id())) {
            throw new DuplicateResourceException("Bài viết", "slug", request.slug());
        }

        applyUpdateRequest(post, request);
        return PostResponse.fromEntity(postRepository.save(post));
    }

    @Override
    @Transactional(readOnly = true)
    public PostResponse getById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết", "id", id));
        return PostResponse.fromEntity(post);
    }

    @Override
    @Transactional(readOnly = true)
    public ResultPaginationDTO filter(PostFilterRequest filter, Pageable pageable) {
        PredicateSpecification<Post> spec = PostSpecification.build(filter);
        Page<PostResponse> pageResult = postRepository.findBy(spec, q -> q.page(pageable))
                .map(PostResponse::fromEntity);
        return ResultPaginationDTO.fromPage(pageResult);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!postRepository.existsById(id)) {
            throw new ResourceNotFoundException("Bài viết", "id", id);
        }
        postRepository.deleteById(id);
    }

    private void applyCreateRequest(Post post, CreatePostRequest request) {
        PostStatus status = request.status() == null ? PostStatus.DRAFT : request.status();
        post.setTitle(request.title());
        post.setSlug(request.slug());
        post.setSummary(request.summary());
        post.setContent(request.content());
        post.setThumbnailUrl(request.thumbnailUrl());
        post.setStatus(status);
        post.setPublishedAt(resolvePublishedAt(status, request.publishedAt()));
        post.setEvent(resolveEvent(request.eventId()));
        post.setTags(resolveTags(request.tagIds()));
    }

    private void applyUpdateRequest(Post post, UpdatePostRequest request) {
        post.setTitle(request.title());
        post.setSlug(request.slug());
        post.setSummary(request.summary());
        post.setContent(request.content());
        post.setThumbnailUrl(request.thumbnailUrl());
        post.setStatus(request.status());
        post.setPublishedAt(resolvePublishedAt(request.status(), request.publishedAt()));
        post.setEvent(resolveEvent(request.eventId()));
        post.setTags(resolveTags(request.tagIds()));
    }

    private Instant resolvePublishedAt(PostStatus status, Instant requestedPublishedAt) {
        if (status == PostStatus.PUBLISHED && requestedPublishedAt == null) {
            return Instant.now();
        }
        return requestedPublishedAt;
    }

    private Event resolveEvent(Long eventId) {
        if (eventId == null) {
            return null;
        }
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Sự kiện", "id", eventId));
    }

    private List<Tag> resolveTags(List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> uniqueIds = tagIds.stream().distinct().toList();
        List<Tag> tags = tagRepository.findAllById(uniqueIds);
        if (tags.size() != uniqueIds.size()) {
            Set<Long> foundIds = tags.stream()
                    .map(Tag::getId)
                    .collect(Collectors.toSet());
            Long missingId = uniqueIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .findFirst()
                    .orElseThrow();
            throw new ResourceNotFoundException("Thẻ", "id", missingId);
        }

        return tags;
    }
}
