package com.example.historyrag.feature.rag;

import com.example.historyrag.feature.rag.dto.RagChatRequest;
import com.example.historyrag.feature.rag.dto.RagIngestRequest;
import com.example.historyrag.feature.rag.dto.RagIngestSettings;
import com.example.historyrag.feature.rag.dto.RagRetrieveRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RagChatRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void validRequestPassesValidation() {
        RagChatRequest request = new RagChatRequest(
                "Nhà Trần thành lập năm nào?",
                5,
                false,
                List.of(1L, 2L),
                List.of(10L),
                0.2
        );

        Set<ConstraintViolation<RagChatRequest>> violations = validator.validate(request);

        assertThat(violations).isEmpty();
    }

    @Test
    void chatRequestDefaultsOptionalConnectionFields() {
        RagChatRequest request = new RagChatRequest("Question", null, null, null, null, null);

        assertThat(request.useGraph()).isFalse();
        assertThat(request.sourceIds()).isEmpty();
        assertThat(request.tagIds()).isEmpty();
        assertThat(request.temperature()).isEqualTo(0.2);
    }

    @Test
    void blankQuestionFailsValidation() {
        RagChatRequest request = new RagChatRequest(" ", 5, false, List.of(), List.of(), 0.2);

        Set<ConstraintViolation<RagChatRequest>> violations = validator.validate(request);

        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .contains("Question is required");
    }

    @Test
    void topKMustStayWithinSupportedRange() {
        RagChatRequest tooSmall = new RagChatRequest("Question", 0, false, List.of(), List.of(), 0.2);
        RagChatRequest tooLarge = new RagChatRequest("Question", 21, false, List.of(), List.of(), 0.2);

        assertThat(validator.validate(tooSmall))
                .extracting(ConstraintViolation::getMessage)
                .contains("topK must be at least 1");
        assertThat(validator.validate(tooLarge))
                .extracting(ConstraintViolation::getMessage)
                .contains("topK must be at most 20");
    }

    @Test
    void temperatureMustStayWithinProviderSafeRange() {
        RagChatRequest tooSmall = new RagChatRequest("Question", 5, false, List.of(), List.of(), -0.1);
        RagChatRequest tooLarge = new RagChatRequest("Question", 5, false, List.of(), List.of(), 1.1);

        assertThat(validator.validate(tooSmall))
                .extracting(ConstraintViolation::getMessage)
                .contains("temperature must be at least 0");
        assertThat(validator.validate(tooLarge))
                .extracting(ConstraintViolation::getMessage)
                .contains("temperature must be at most 1");
    }

    @Test
    void retrieveRequestDefaultsFilterLists() {
        RagRetrieveRequest request = new RagRetrieveRequest("Question", null, null, null);

        assertThat(request.sourceIds()).isEmpty();
        assertThat(request.tagIds()).isEmpty();
        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void ingestRequestRequiresAtLeastOneContentInput() {
        RagIngestRequest request = new RagIngestRequest(
                1L,
                "DOCUMENT",
                "Document",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        assertThat(validator.validate(request))
                .extracting(ConstraintViolation::getMessage)
                .contains("One of filePath, sourceUrl, or rawContent is required");
    }

    @Test
    void ingestRequestDefaultsNestedMetadataAndSettings() {
        RagIngestRequest request = new RagIngestRequest(
                1L,
                "MANUAL_INPUT",
                "Manual",
                null,
                null,
                null,
                null,
                "Noi dung",
                null,
                null
        );

        assertThat(request.metadata().tagIds()).isEmpty();
        assertThat(request.settings().chunkSize()).isNull();
        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void ingestSettingsValidatesChunkBounds() {
        RagIngestRequest request = new RagIngestRequest(
                1L,
                "MANUAL_INPUT",
                "Manual",
                null,
                null,
                null,
                null,
                "Noi dung",
                null,
                new RagIngestSettings(50, 2000)
        );

        assertThat(validator.validate(request))
                .extracting(ConstraintViolation::getMessage)
                .contains("chunkSize must be at least 100", "chunkOverlap must be at most 1000");
    }
}
