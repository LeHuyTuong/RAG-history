package com.example.historyrag.feature.admin;

import java.util.Optional;

public interface AdminService {

    long countAdmins();

    Admin getAdminEntityById(Long id);

    Optional<Admin> findAdminByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);
}
