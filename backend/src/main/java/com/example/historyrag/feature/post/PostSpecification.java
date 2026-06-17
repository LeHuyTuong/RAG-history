package com.example.historyrag.feature.post;

import com.example.historyrag.feature.post.dto.PostFilterRequest;
import jakarta.persistence.criteria.From;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.hibernate.query.criteria.HibernateCriteriaBuilder;
import org.hibernate.query.criteria.JpaExpression;
import org.springframework.data.jpa.domain.PredicateSpecification;

import java.util.ArrayList;
import java.util.List;

public class PostSpecification {

    private PostSpecification() {
    }

    public static PredicateSpecification<Post> build(PostFilterRequest filter) {
        return (from, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.keyword() != null && !filter.keyword().isBlank()) {
                HibernateCriteriaBuilder hibernateCriteriaBuilder = (HibernateCriteriaBuilder) cb;
                String keyword = "%" + filter.keyword().trim() + "%";
                predicates.add(hibernateCriteriaBuilder.or(
                        containsIgnoreCase(hibernateCriteriaBuilder, from, "title", keyword),
                        containsIgnoreCase(hibernateCriteriaBuilder, from, "slug", keyword),
                        containsIgnoreCase(hibernateCriteriaBuilder, from, "summary", keyword),
                        containsIgnoreCase(hibernateCriteriaBuilder, from, "content", keyword)
                ));
            }

            if (filter.status() != null) {
                predicates.add(cb.equal(from.get("status"), filter.status()));
            }

            if (filter.eventId() != null) {
                predicates.add(cb.equal(from.get("event").get("id"), filter.eventId()));
            }

            if (filter.tagId() != null) {
                predicates.add(cb.equal(from.join("tags", JoinType.INNER).get("id"), filter.tagId()));
            }

            if (filter.authorId() != null) {
                predicates.add(cb.equal(from.get("admin").get("id"), filter.authorId()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @SuppressWarnings("unchecked")
    private static Predicate containsIgnoreCase(
            HibernateCriteriaBuilder cb,
            From<?, Post> from,
            String field,
            String keyword) {
        JpaExpression<String> expression = (JpaExpression<String>) from.<String>get(field);
        return cb.ilike(expression.cast(String.class), keyword);
    }
}
