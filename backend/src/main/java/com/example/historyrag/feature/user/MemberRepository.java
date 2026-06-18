package com.example.historyrag.feature.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByUsername(String username);
    boolean existsByUsernameAndIdNot(String username, Long id);
    Page<Member> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(
            String usernameKeyword,
            String emailKeyword,
            String fullNameKeyword,
            Pageable pageable);
}
