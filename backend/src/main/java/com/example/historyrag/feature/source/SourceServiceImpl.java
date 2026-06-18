package com.example.historyrag.feature.source;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.source.dto.CreateSourceRequest;
import com.example.historyrag.feature.source.dto.SourceFilterRequest;
import com.example.historyrag.feature.source.dto.SourceResponse;
import com.example.historyrag.feature.source.dto.UpdateSourceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SourceServiceImpl implements SourceService {

    private final SourceRepository sourceRepository;

    public SourceServiceImpl(SourceRepository sourceRepository) {
        this.sourceRepository = sourceRepository;
    }

    @Override
    @Transactional
    public SourceResponse create(CreateSourceRequest request) {
        Source source = new Source();
        applyCreateRequest(source, request);
        return SourceResponse.fromEntity(sourceRepository.save(source));
    }

    @Override
    @Transactional
    public SourceResponse update(Long id, UpdateSourceRequest request) {
        Source source = sourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nguồn tư liệu", "id", id));

        applyUpdateRequest(source, request);
        return SourceResponse.fromEntity(sourceRepository.save(source));
    }

    @Override
    @Transactional(readOnly = true)
    public SourceResponse getById(Long id) {
        Source source = sourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nguồn tư liệu", "id", id));
        return SourceResponse.fromEntity(source);
    }

    @Override
    @Transactional(readOnly = true)
    public ResultPaginationDTO filter(SourceFilterRequest filter, Pageable pageable) {
        PredicateSpecification<Source> spec = SourceSpecification.build(filter);
        Page<SourceResponse> pageResult = sourceRepository.findBy(spec, q -> q.page(pageable))
                .map(SourceResponse::fromEntity);
        return ResultPaginationDTO.fromPage(pageResult);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!sourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Nguồn tư liệu", "id", id);
        }
        sourceRepository.deleteById(id);
    }

    private void applyCreateRequest(Source source, CreateSourceRequest request) {
        source.setTitle(request.title());
        source.setSourceType(request.sourceType());
        source.setSourceUrl(request.sourceUrl());
        source.setFilePath(request.filePath());
        source.setContent(request.content());
        source.setAuthor(request.author());
        source.setPublicationYear(request.publicationYear());
        source.setReliabilityLevel(request.reliabilityLevel());
    }

    private void applyUpdateRequest(Source source, UpdateSourceRequest request) {
        source.setTitle(request.title());
        source.setSourceType(request.sourceType());
        source.setSourceUrl(request.sourceUrl());
        source.setFilePath(request.filePath());
        source.setContent(request.content());
        source.setAuthor(request.author());
        source.setPublicationYear(request.publicationYear());
        source.setReliabilityLevel(request.reliabilityLevel());
    }
}
