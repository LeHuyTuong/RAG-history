package com.example.historyrag.feature.location;

import com.example.historyrag.feature.location.dto.LocationFilterRequest;
import jakarta.persistence.criteria.From;
import jakarta.persistence.criteria.Predicate;
import org.hibernate.query.criteria.HibernateCriteriaBuilder;
import org.hibernate.query.criteria.JpaExpression;
import org.springframework.data.jpa.domain.PredicateSpecification;

import java.util.ArrayList;
import java.util.List;

public class LocationSpecification {

    private LocationSpecification() {
    }

    public static PredicateSpecification<Location> build(LocationFilterRequest filter) {
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

            if (filter.locationType() != null) {
                predicates.add(cb.equal(from.get("locationType"), filter.locationType()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @SuppressWarnings("unchecked")
    private static Predicate containsIgnoreCase(
            HibernateCriteriaBuilder cb,
            From<?, Location> from,
            String field,
            String keyword) {
        JpaExpression<String> expression = (JpaExpression<String>) from.<String>get(field);
        return cb.ilike(expression.cast(String.class), keyword);
    }
}
