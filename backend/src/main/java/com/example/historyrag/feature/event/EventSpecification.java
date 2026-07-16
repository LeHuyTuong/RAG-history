package com.example.historyrag.feature.event;

import com.example.historyrag.feature.event.dto.EventFilterRequest;
import jakarta.persistence.criteria.From;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.hibernate.query.criteria.HibernateCriteriaBuilder;
import org.hibernate.query.criteria.JpaExpression;
import org.springframework.data.jpa.domain.PredicateSpecification;

import java.util.ArrayList;
import java.util.List;

public class EventSpecification {

    private EventSpecification() {
    }

    public static PredicateSpecification<Event> build(EventFilterRequest filter) {
        return (from, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.keyword() != null && !filter.keyword().isBlank()) {
                HibernateCriteriaBuilder hibernateCriteriaBuilder = (HibernateCriteriaBuilder) cb;
                String keyword = "%" + filter.keyword().trim() + "%";
                predicates.add(hibernateCriteriaBuilder.or(
                        containsIgnoreCase(hibernateCriteriaBuilder, from, "name", keyword),
                        containsIgnoreCase(hibernateCriteriaBuilder, from, "slug", keyword),
                        containsIgnoreCase(hibernateCriteriaBuilder, from, "description", keyword)
                ));
            }

            if (filter.periodId() != null) {
                predicates.add(cb.equal(from.get("period").get("id"), filter.periodId()));
            }

            if (filter.locationId() != null) {
                Join<Event, EventLocation> eventLocation = from.join("eventLocations");
                predicates.add(cb.equal(eventLocation.get("location").get("id"), filter.locationId()));
            }

            if (filter.certaintyLevel() != null) {
                predicates.add(cb.equal(from.get("certaintyLevel"), filter.certaintyLevel()));
            }

            if (filter.startYearFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(from.get("startYear"), filter.startYearFrom()));
            }

            if (filter.startYearTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(from.get("startYear"), filter.startYearTo()));
            }

            if (filter.status() != null) {
                predicates.add(cb.equal(from.get("status"), filter.status()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @SuppressWarnings("unchecked")
    private static Predicate containsIgnoreCase(
            HibernateCriteriaBuilder cb,
            From<?, Event> from,
            String field,
            String keyword) {
        JpaExpression<String> expression = (JpaExpression<String>) from.<String>get(field);
        return cb.ilike(expression.cast(String.class), keyword);
    }
}
