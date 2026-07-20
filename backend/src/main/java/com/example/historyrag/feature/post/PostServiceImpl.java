package com.example.historyrag.feature.post;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.admin.Admin;
import com.example.historyrag.feature.admin.AdminService;
import com.example.historyrag.feature.event.Event;
import com.example.historyrag.feature.event.EventService;
import com.example.historyrag.feature.post.dto.CreatePostRequest;
import com.example.historyrag.feature.post.dto.PostFilterRequest;
import com.example.historyrag.feature.post.dto.PostResponse;
import com.example.historyrag.feature.post.dto.UpdatePostRequest;
import com.example.historyrag.feature.rag.RagService;
import com.example.historyrag.feature.rag.dto.RagIngestMetadata;
import com.example.historyrag.feature.rag.dto.RagIngestRequest;
import com.example.historyrag.feature.rag.dto.RagIngestSettings;
import com.example.historyrag.feature.tag.Tag;
import com.example.historyrag.feature.tag.TagService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.PredicateSpecification;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private static final Logger log = LoggerFactory.getLogger(PostServiceImpl.class);

    // Offset để tách namespace sourceId article (1_000_001+) khỏi sách PDF (1–999)
    private static final long RAG_ARTICLE_SOURCE_OFFSET = 1_000_000L;

    private final PostRepository postRepository;
    private final AdminService adminService;
    private final EventService eventService;
    private final TagService tagService;
    private final RagService ragService;

    @Override
    @Transactional
    public PostResponse create(CreatePostRequest request, Long adminId) {
        if (postRepository.existsBySlug(request.slug())) {
            throw new DuplicateResourceException("Bài viết", "slug", request.slug());
        }

        Admin admin = adminService.getAdminEntityById(adminId);

        Post post = new Post();
        post.setAdmin(admin);
        applyCreateRequest(post, request);

        Post saved = postRepository.save(post);
        if (PostStatus.PUBLISHED.equals(saved.getStatus())) {
            tryIngest(saved);
        }
        return PostResponse.fromEntity(saved);
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
        Post saved = postRepository.save(post);
        if (PostStatus.PUBLISHED.equals(saved.getStatus())) {
            tryIngest(saved);
        } else {
            tryDeleteFromRag(saved.getId());
        }
        return PostResponse.fromEntity(saved);
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
        tryDeleteFromRag(id);
        postRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public long countPosts() {
        return postRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public long countPostsByStatus(PostStatus status) {
        return postRepository.countByStatus(status);
    }

    @Override
    @Transactional(readOnly = true)
    public int syncAllPublishedToRag() {
        List<Post> published = postRepository.findAll().stream()
                .filter(p -> PostStatus.PUBLISHED.equals(p.getStatus()))
                .toList();
        int count = 0;
        for (Post post : published) {
            try {
                tryIngest(post);
                count++;
            } catch (Exception ex) {
                log.warn("Sync failed for post {}: {}", post.getId(), ex.getMessage());
            }
        }
        log.info("RAG sync: {}/{} posts ingested", count, published.size());
        return count;
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
        post.setStartYear(request.startYear());
        post.setEndYear(request.endYear());
        post.getEvents().clear();
        post.getEvents().addAll(resolveEvents(request.eventIds()));
        post.getTags().clear();
        post.getTags().addAll(resolveTags(request.tagIds()));
    }

    private void applyUpdateRequest(Post post, UpdatePostRequest request) {
        post.setTitle(request.title());
        post.setSlug(request.slug());
        post.setSummary(request.summary());
        post.setContent(request.content());
        post.setThumbnailUrl(request.thumbnailUrl());
        post.setStatus(request.status());
        post.setPublishedAt(resolvePublishedAt(request.status(), request.publishedAt()));
        post.setStartYear(request.startYear());
        post.setEndYear(request.endYear());
        post.getEvents().clear();
        post.getEvents().addAll(resolveEvents(request.eventIds()));
        post.getTags().clear();
        post.getTags().addAll(resolveTags(request.tagIds()));
    }

    private Instant resolvePublishedAt(PostStatus status, Instant requestedPublishedAt) {
        if (status == PostStatus.PUBLISHED && requestedPublishedAt == null) {
            return Instant.now();
        }
        return requestedPublishedAt;
    }

    private List<Event> resolveEvents(List<Long> eventIds) {
        if (eventIds == null || eventIds.isEmpty()) {
            return new ArrayList<>();
        }
        return eventService.getEventsByIds(eventIds);
    }

    private void tryIngest(Post post) {
        try {
            String rawContent = buildRawContent(post);
            if (rawContent.isBlank()) return;

            List<Long> tagIds = post.getTags().stream().map(Tag::getId).toList();
            List<Long> eventIds = post.getEvents() != null
                    ? post.getEvents().stream().map(Event::getId).toList() : List.of();

            RagIngestMetadata meta = new RagIngestMetadata(
                    null, null, post.getSlug(), tagIds, eventIds, List.of());
            RagIngestRequest req = new RagIngestRequest(
                    post.getId() + RAG_ARTICLE_SOURCE_OFFSET, "ARTICLE", post.getTitle(),
                    post.getId(), null, null, null, rawContent,
                    meta, RagIngestSettings.empty());
            ragService.ingest(req, null);
            log.debug("RAG ingest OK: post {}", post.getId());
        } catch (Exception ex) {
            log.warn("RAG ingest skipped for post {}: {}", post.getId(), ex.getMessage());
        }
    }

    private void tryDeleteFromRag(Long postId) {
        try {
            ragService.deleteSource(postId + RAG_ARTICLE_SOURCE_OFFSET, null);
            log.debug("RAG delete OK: post {}", postId);
        } catch (Exception ex) {
            log.warn("RAG delete skipped for post {}: {}", postId, ex.getMessage());
        }
    }

    private String buildRawContent(Post post) {
        StringBuilder sb = new StringBuilder(post.getTitle());
        if (post.getSummary() != null && !post.getSummary().isBlank()) {
            sb.append("\n\n").append(post.getSummary());
        }
        if (post.getContent() != null && !post.getContent().isBlank()) {
            sb.append("\n\n").append(post.getContent());
        }
        return sb.toString();
    }

    private List<Tag> resolveTags(List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return new ArrayList<>();
        }

        return tagService.getTagsByIds(tagIds);
    }
}
