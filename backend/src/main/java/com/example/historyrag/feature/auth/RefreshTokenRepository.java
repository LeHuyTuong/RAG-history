package com.example.historyrag.feature.auth;

import com.example.historyrag.feature.admin.Admin;
import com.example.historyrag.feature.user.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    void deleteByAdmin(Admin admin);

    void deleteByMember(Member member);
}
