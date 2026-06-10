package com.example.historyrag.security;

import com.example.historyrag.feature.admin.Admin;
import com.example.historyrag.feature.admin.AdminRepository;
import com.example.historyrag.feature.user.Member;
import com.example.historyrag.feature.user.MemberRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final GrantedAuthority ADMIN_AUTHORITY = new SimpleGrantedAuthority("ROLE_ADMIN");
    private static final GrantedAuthority USER_AUTHORITY = new SimpleGrantedAuthority("ROLE_USER");

    private final AdminRepository adminRepository;
    private final MemberRepository memberRepository;

    public CustomUserDetailsService(AdminRepository adminRepository, MemberRepository memberRepository) {
        this.adminRepository = adminRepository;
        this.memberRepository = memberRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return adminRepository.findByEmail(email)
                .map(this::buildAdminDetails)
                .or(() -> memberRepository.findByEmail(email).map(this::buildMemberDetails))
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Không tìm thấy tài khoản admin hoặc user với email: " + email));
    }

    private UserDetails buildAdminDetails(Admin admin) {
        return buildUserDetails(
                admin.getEmail(),
                admin.getPasswordHash(),
                admin.getStatus(),
                List.of(ADMIN_AUTHORITY));
    }

    private UserDetails buildMemberDetails(Member member) {
        return buildUserDetails(
                member.getEmail(),
                member.getPasswordHash(),
                member.getStatus(),
                List.of(USER_AUTHORITY));
    }

    private UserDetails buildUserDetails(
            String email,
            String passwordHash,
            Member.UserStatus status,
            List<GrantedAuthority> authorities) {
        boolean isActive = ACTIVE_STATUS.equalsIgnoreCase(String.valueOf(status));
        return org.springframework.security.core.userdetails.User.builder()
                .username(email)
                .password(passwordHash)
                .authorities(authorities)
                .disabled(!isActive)
                .accountLocked(!isActive)
                .build();
    }
}
