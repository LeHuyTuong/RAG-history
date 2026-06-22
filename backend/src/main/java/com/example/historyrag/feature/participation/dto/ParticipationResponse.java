package com.example.historyrag.feature.participation.dto;

import com.example.historyrag.feature.event.Event;
import com.example.historyrag.feature.participation.Participation;
import com.example.historyrag.feature.participation.ParticipationRole;
import com.example.historyrag.feature.person.Person;

import java.math.BigDecimal;
import java.time.Instant;

public record ParticipationResponse(
        Long id,
        EventSummary event,
        PersonSummary person,
        ParticipationRole role,
        String note,
        BigDecimal confidence,
        Instant createdAt,
        Instant updatedAt
) {
    public static ParticipationResponse fromEntity(Participation participation) {
        return new ParticipationResponse(
                participation.getId(),
                EventSummary.fromEntity(participation.getEvent()),
                PersonSummary.fromEntity(participation.getPerson()),
                participation.getRole(),
                participation.getNote(),
                participation.getConfidence(),
                participation.getCreatedAt(),
                participation.getUpdatedAt()
        );
    }

    public record EventSummary(
            Long id,
            String name,
            String slug
    ) {
        public static EventSummary fromEntity(Event event) {
            return new EventSummary(event.getId(), event.getName(), event.getSlug());
        }
    }

    public record PersonSummary(
            Long id,
            String name,
            String slug
    ) {
        public static PersonSummary fromEntity(Person person) {
            return new PersonSummary(person.getId(), person.getName(), person.getSlug());
        }
    }
}
