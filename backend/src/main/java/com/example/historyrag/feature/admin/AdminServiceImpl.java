package com.example.historyrag.feature.admin;

import com.example.historyrag.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final AdminRepository adminRepository;

    @Override
    @Transactional(readOnly = true)
    public long countAdmins() {
        return adminRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public Admin getAdminEntityById(Long id) {
        return adminRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quản trị viên", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Admin> findAdminByEmail(String email) {
        return adminRepository.findByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return adminRepository.existsByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return adminRepository.existsByUsername(username);
    }
}
