package com.example.historyrag.feature.person.dto;

import com.example.historyrag.feature.person.Person;

import java.time.Instant;
import java.time.LocalDate;

public record PersonResponse(
        Long id,
        String name,
        String slug,
        String alias,
        LocalDate birthDate,
        LocalDate deathDate,
        String biography,
        Instant createdAt,
        Instant updatedAt
) {
    public static PersonResponse fromEntity(Person person) {
        return new PersonResponse(
                person.getId(),
                person.getName(),
                person.getSlug(),
                person.getAlias(),
                person.getBirthDate(),
                person.getDeathDate(),
                person.getBiography(),
                person.getCreatedAt(),
                person.getUpdatedAt()
        );
    }
}
