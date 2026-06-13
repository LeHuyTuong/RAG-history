package com.example.historyrag.feature.tag;

import com.example.historyrag.exception.ConflictException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.feature.tag.dto.TagRequest;
import com.example.historyrag.feature.tag.dto.TagResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

@Service
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;

    public TagServiceImpl(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @Override
    @Transactional
    public TagResponse createTag(TagRequest request) {
        if (tagRepository.existsByName(request.name())) {
            throw new ConflictException("Tag name already exists: " + request.name());
        }
        if (tagRepository.existsBySlug(request.slug())) {
            throw new ConflictException("Tag slug already exists: " + request.slug());
        }

        Tag tag = new Tag();
        tag.setName(request.name());
        tag.setSlug(request.slug());
        tag.setDescription(request.description());
        tag.setCreatedAt(Instant.now());
        tag.setUpdatedAt(Instant.now());

        return TagResponse.fromEntity(tagRepository.save(tag));
    }

    @Override
    @Transactional
    public TagResponse updateTag(Long id, TagRequest request) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", "id", id));
        if (!tag.getName().equals(request.name()) && tagRepository.existsByName(request.name())) {
            throw new InvalidRequestException("Tag name already exists: " + request.name());
        }
        if (!tag.getSlug().equals(request.slug()) && tagRepository.existsBySlug(request.slug())) {
            throw new InvalidRequestException("Tag slug already exists: " + request.slug());
        }
        tag.setName(request.name());
        tag.setSlug(request.slug());
        tag.setDescription(request.description());
        tag.setUpdatedAt(Instant.now());

        return TagResponse.fromEntity(tagRepository.save(tag));
    }

    @Override
    public Page<TagResponse> getAllTags(Pageable pageable) {
        return tagRepository.findAll(pageable).map(TagResponse::fromEntity);
    }

    @Override
    @Transactional
    public void deleteTag(Long id) {
        if (!tagRepository.existsById(id)) {
            throw new ResourceNotFoundException("Tag", "id", id);
        }
        tagRepository.deleteById(id);
    }
}