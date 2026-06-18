package com.example.historyrag.feature.source;

import com.example.historyrag.feature.source.dto.SourceFilterRequest;
import jakarta.persistence.criteria.From;
import jakarta.persistence.criteria.Predicate;
import org.hibernate.query.criteria.HibernateCriteriaBuilder;
import org.hibernate.query.criteria.JpaExpression;
import org.springframework.data.jpa.domain.PredicateSpecification;

import java.util.ArrayList;
import java.util.List;

public class SourceSpecification {

    private SourceSpecification() {
    }

    public static PredicateSpecification<Source> build(SourceFilterRequest filter) {
        return (from, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.keyword() != null && !filter.keyword().isBlank()) {
                HibernateCriteriaBuilder hibernateCriteriaBuilder = (HibernateCriteriaBuilder) cb;
                String keyword = "%" + filter.keyword().trim() + "%";
                predicates.add(hibernateCriteriaBuilder.or(
                        containsIgnoreCase(hibernateCriteriaBuilder, from, "title", keyword),
                        containsIgnoreCase(hibernateCriteriaBuilder, from, "sourceUrl", keyword),
                        containsIgnoreCase(hibernateCriteriaBuilder, from, "filePath", keyword),
                        containsIgnoreCase(hibernateCriteriaBuilder, from, "content", keyword),
                        containsIgnoreCase(hibernateCriteriaBuilder, from, "author", keyword)
                ));
            }

            if (filter.sourceType() != null) {
                predicates.add(cb.equal(from.get("sourceType"), filter.sourceType()));
            }

            if (filter.reliabilityLevel() != null) {
                predicates.add(cb.equal(from.get("reliabilityLevel"), filter.reliabilityLevel()));
            }

            if (filter.publicationYear() != null) {
                predicates.add(cb.equal(from.get("publicationYear"), filter.publicationYear()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @SuppressWarnings("unchecked")
    private static Predicate containsIgnoreCase(
            HibernateCriteriaBuilder cb,
            From<?, Source> from,
            String field,
            String keyword) {
        JpaExpression<String> expression = (JpaExpression<String>) from.<String>get(field);
        return cb.ilike(expression.cast(String.class), keyword);
    }
}
