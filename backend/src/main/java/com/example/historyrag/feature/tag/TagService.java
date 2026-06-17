package com.example.historyrag.feature.tag;


import com.example.historyrag.feature.tag.dto.TagRequest;
import com.example.historyrag.feature.tag.dto.TagResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TagService {
    TagResponse createTag(TagRequest request);
    TagResponse updateTag(Long id, TagRequest request);
    Page<TagResponse> getAllTags(Pageable pageable);
    void deleteTag(Long id);
}
