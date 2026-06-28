package com.example.historyrag.feature.source;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SourceRepository extends JpaRepository<Source, Long>, JpaSpecificationExecutor<Source> {
}
