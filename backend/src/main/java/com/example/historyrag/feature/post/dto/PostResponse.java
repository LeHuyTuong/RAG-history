package com.example.historyrag.feature.post.dto;

import com.example.historyrag.feature.admin.Admin;
import com.example.historyrag.feature.event.Event;
import com.example.historyrag.feature.post.Post;
import com.example.historyrag.feature.post.PostStatus;
import com.example.historyrag.feature.tag.Tag;

import java.time.Instant;
import java.util.List;

public record PostResponse(
        Long id,
        String title,
        String slug,
        String summary,
        String content,
        String thumbnailUrl,
        PostStatus status,
        Instant publishedAt,
        AuthorResponse author,
        EventResponse event,
        List<TagResponse> tags,
        Instant createdAt,
        Instant updatedAt
) {
    public static PostResponse fromEntity(Post post) {
        return new PostResponse(
                post.getId(),
                post.getTitle(),
                post.getSlug(),
                post.getSummary(),
                post.getContent(),
                post.getThumbnailUrl(),
                post.getStatus(),
                post.getPublishedAt(),
                AuthorResponse.fromEntity(post.getAdmin()),
                EventResponse.fromEntity(post.getEvent()),
                post.getTags().stream().map(TagResponse::fromEntity).toList(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }

    public record AuthorResponse(
            Long id,
            String username,
            String fullName,
            String email
    ) {
        public static AuthorResponse fromEntity(Admin admin) {
            if (admin == null) {
                return null;
            }
            return new AuthorResponse(
                    admin.getId(),
                    admin.getUsername(),
                    admin.getFullName(),
                    admin.getEmail()
            );
        }
    }

    public record EventResponse(
            Long id,
            String name,
            String slug
    ) {
        public static EventResponse fromEntity(Event event) {
            if (event == null) {
                return null;
            }
            return new EventResponse(
                    event.getId(),
                    event.getName(),
                    event.getSlug()
            );
        }
    }

    public record TagResponse(
            Long id,
            String name,
            String slug
    ) {
        public static TagResponse fromEntity(Tag tag) {
            return new TagResponse(
                    tag.getId(),
                    tag.getName(),
                    tag.getSlug()
            );
        }
    }
}
