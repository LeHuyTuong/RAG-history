package com.example.historyrag.feature.source;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.source.dto.CreateSourceRequest;
import com.example.historyrag.feature.source.dto.SourceFilterRequest;
import com.example.historyrag.feature.source.dto.SourceResponse;
import com.example.historyrag.feature.source.dto.UpdateSourceRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.PredicateSpecification;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SourceServiceImplTest {

    @Mock
    private SourceRepository sourceRepository;

    private SourceServiceImpl sourceService;

    @BeforeEach
    void setUp() {
        sourceService = new SourceServiceImpl(sourceRepository);
    }

    @Test
    @DisplayName("Should create source when request is valid")
    void create_validRequest_returnsSourceResponse() {
        CreateSourceRequest request = createRequest();
        when(sourceRepository.save(any(Source.class))).thenAnswer(invocation -> {
            Source saved = invocation.getArgument(0);
            saved.setId(1L);
            saved.setCreatedAt(Instant.parse("2026-06-16T00:00:00Z"));
            saved.setUpdatedAt(Instant.parse("2026-06-16T01:00:00Z"));
            return saved;
        });

        SourceResponse response = sourceService.create(request);

        assertEquals(1L, response.id());
        assertEquals("Đại Việt sử ký toàn thư", response.title());
        assertEquals(SourceType.BOOK, response.sourceType());
        assertEquals(ReliabilityLevel.HIGH, response.reliabilityLevel());
    }

    @Test
    @DisplayName("Should update source when it exists")
    void update_existingSource_returnsUpdatedSourceResponse() {
        Source source = source(1L);
        UpdateSourceRequest request = updateRequest();
        when(sourceRepository.findById(source.getId())).thenReturn(Optional.of(source));
        when(sourceRepository.save(source)).thenReturn(source);

        SourceResponse response = sourceService.update(source.getId(), request);

        assertEquals("Cổ Loa: khảo cổ và lịch sử", response.title());
        assertEquals(SourceType.ARTICLE, response.sourceType());
        assertEquals(2015, response.publicationYear());
    }

    @Test
    @DisplayName("Should reject update when source does not exist")
    void update_missingSource_throwsResourceNotFoundException() {
        UpdateSourceRequest request = updateRequest();
        when(sourceRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> sourceService.update(404L, request));
    }

    @Test
    @DisplayName("Should return source detail by id")
    void getById_existingSource_returnsSourceResponse() {
        Source source = source(1L);
        when(sourceRepository.findById(source.getId())).thenReturn(Optional.of(source));

        SourceResponse response = sourceService.getById(source.getId());

        assertEquals(source.getId(), response.id());
        assertEquals(source.getTitle(), response.title());
    }

    @Test
    @DisplayName("Should reject get by id when source does not exist")
    void getById_missingSource_throwsResourceNotFoundException() {
        when(sourceRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> sourceService.getById(404L));
    }

    @Test
    @DisplayName("Should return ResultPaginationDTO when filtering sources")
    @SuppressWarnings({"unchecked", "rawtypes"})
    void filter_existingSources_returnsPaginationDTO() {
        PageRequest pageable = PageRequest.of(0, 10);
        Source source = source(1L);
        PageImpl<Source> page = new PageImpl<>(List.of(source), pageable, 1);
        when(sourceRepository.findBy(any(PredicateSpecification.class), any(Function.class))).thenReturn(page);

        ResultPaginationDTO result = sourceService.filter(
                new SourceFilterRequest("đại việt", SourceType.BOOK, ReliabilityLevel.HIGH, 1697),
                pageable);

        assertEquals(1, result.meta().page());
        assertEquals(10, result.meta().pageSize());
        assertEquals(1, result.meta().total());
        assertEquals(1, result.result().size());
    }

    @Test
    @DisplayName("Should delete source when it exists")
    void delete_existingSource_deletesById() {
        when(sourceRepository.existsById(1L)).thenReturn(true);

        sourceService.delete(1L);

        verify(sourceRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Should reject delete when source does not exist")
    void delete_missingSource_throwsResourceNotFoundException() {
        when(sourceRepository.existsById(404L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> sourceService.delete(404L));
    }

    private CreateSourceRequest createRequest() {
        return new CreateSourceRequest(
                "Đại Việt sử ký toàn thư",
                SourceType.BOOK,
                null,
                "/seed/sources/dai-viet-su-ky-toan-thu.pdf",
                "Tư liệu lịch sử",
                "Ngô Sĩ Liên",
                1697,
                ReliabilityLevel.HIGH
        );
    }

    private UpdateSourceRequest updateRequest() {
        return new UpdateSourceRequest(
                "Cổ Loa: khảo cổ và lịch sử",
                SourceType.ARTICLE,
                "https://example.local/sources/co-loa",
                null,
                "Bài nghiên cứu tổng hợp",
                "Viện Sử học",
                2015,
                ReliabilityLevel.HIGH
        );
    }

    private Source source(Long id) {
        Source source = new Source();
        source.setId(id);
        source.setTitle("Đại Việt sử ký toàn thư");
        source.setSourceType(SourceType.BOOK);
        source.setSourceUrl(null);
        source.setFilePath("/seed/sources/dai-viet-su-ky-toan-thu.pdf");
        source.setContent("Tư liệu lịch sử");
        source.setAuthor("Ngô Sĩ Liên");
        source.setPublicationYear(1697);
        source.setReliabilityLevel(ReliabilityLevel.HIGH);
        source.setCreatedAt(Instant.parse("2026-06-16T00:00:00Z"));
        source.setUpdatedAt(Instant.parse("2026-06-16T01:00:00Z"));
        return source;
    }
}
