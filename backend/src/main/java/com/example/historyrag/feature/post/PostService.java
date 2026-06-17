package com.example.historyrag.feature.post;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.post.dto.CreatePostRequest;
import com.example.historyrag.feature.post.dto.PostFilterRequest;
import com.example.historyrag.feature.post.dto.PostResponse;
import com.example.historyrag.feature.post.dto.UpdatePostRequest;
import org.springframework.data.domain.Pageable;

public interface PostService {

    PostResponse create(CreatePostRequest request, Long adminId);

    PostResponse update(UpdatePostRequest request);

    PostResponse getById(Long id);

    ResultPaginationDTO filter(PostFilterRequest filter, Pageable pageable);

    void delete(Long id);
}
