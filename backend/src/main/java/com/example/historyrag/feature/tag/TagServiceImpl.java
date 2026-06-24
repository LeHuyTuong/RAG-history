package com.example.historyrag.feature.tag;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.ConflictException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.feature.tag.dto.TagRequest;
import com.example.historyrag.feature.tag.dto.TagResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;

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

        return TagResponse.fromEntity(tagRepository.save(tag));
    }

    @Override
    public ResultPaginationDTO getAllTags(Pageable pageable) {
        return ResultPaginationDTO.fromPage(tagRepository.findAll(pageable).map(TagResponse::fromEntity));
    }

    @Override
    @Transactional
    public void deleteTag(Long id) {
        if (!tagRepository.existsById(id)) {
            throw new ResourceNotFoundException("Tag", "id", id);
        }
        tagRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public long countTags() {
        return tagRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Tag> getTagsByIds(List<Long> ids) {
        List<Long> uniqueIds = ids.stream().distinct().toList();
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
