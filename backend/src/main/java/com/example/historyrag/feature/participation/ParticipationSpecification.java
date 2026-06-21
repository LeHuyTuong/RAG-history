package com.example.historyrag.feature.participation;

import com.example.historyrag.feature.participation.dto.ParticipationFilterRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.PredicateSpecification;

import java.util.ArrayList;
import java.util.List;

public class ParticipationSpecification {

    private ParticipationSpecification() {
    }

    public static PredicateSpecification<Participation> build(ParticipationFilterRequest filter) {
        return (from, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.eventId() != null) {
                predicates.add(cb.equal(from.get("event").get("id"), filter.eventId()));
            }

            if (filter.personId() != null) {
                predicates.add(cb.equal(from.get("person").get("id"), filter.personId()));
            }

            if (filter.role() != null) {
                predicates.add(cb.equal(from.get("role"), filter.role()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
