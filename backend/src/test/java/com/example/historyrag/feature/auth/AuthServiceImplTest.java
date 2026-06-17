package com.example.historyrag.feature.auth;

import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.InvalidTokenException;
import com.example.historyrag.feature.admin.Admin;
import com.example.historyrag.feature.admin.AdminRepository;
import com.example.historyrag.feature.auth.dto.AuthUserResponse;
import com.example.historyrag.feature.auth.dto.LoginRequest;
import com.example.historyrag.feature.auth.dto.LoginResponse;
import com.example.historyrag.feature.auth.dto.RegisterRequest;
import com.example.historyrag.feature.auth.dto.RegisterResponse;
import com.example.historyrag.feature.user.Member;
import com.example.historyrag.feature.user.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtEncoder jwtEncoder;

    @Mock
    private JwtDecoder jwtDecoder;

    @Mock
    private AdminRepository adminRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(
                authenticationManager,
                jwtEncoder,
                jwtDecoder,
                adminRepository,
                memberRepository,
                refreshTokenRepository,
                passwordEncoder,
                900,
                259200
        );
    }

    @Test
    @DisplayName("Should login member and store hashed refresh token")
    void login_memberCredentials_returnsTokensAndStoresRefreshToken() {
        Member member = member(1L, "member@example.com", "member", "Member Name");
        when(memberRepository.findByEmail("member@example.com")).thenReturn(Optional.of(member));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class)))
                .thenReturn(jwt("access-token"), jwt("refresh-token"));

        LoginResponse response = authService.login(
                new LoginRequest("member@example.com", "password123"),
                "JUnit",
                "127.0.0.1"
        );

        assertEquals("access-token", response.accessToken());
        assertEquals("refresh-token", response.refreshToken());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        RefreshToken savedToken = captor.getValue();
        assertEquals(member, savedToken.getMember());
        assertNull(savedToken.getAdmin());
        assertEquals(sha256("refresh-token"), savedToken.getTokenHash());
        assertFalse(savedToken.getRevoked());
        assertEquals("JUnit", savedToken.getDeviceInfo());
        assertEquals("127.0.0.1", savedToken.getIpAddress());
    }

    @Test
    @DisplayName("Should register member with generated username when username is omitted")
    void register_missingUsername_generatesUsernameAndSavesMember() {
        RegisterRequest request = new RegisterRequest(null, "Nguyen Van A", "nguyenvana@example.com", "password123");
        when(adminRepository.existsByEmail(request.email())).thenReturn(false);
        when(memberRepository.existsByEmail(request.email())).thenReturn(false);
        when(adminRepository.existsByUsername("nguyenvana")).thenReturn(false);
        when(memberRepository.existsByUsername("nguyenvana")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> {
            Member member = invocation.getArgument(0);
            member.setId(10L);
            return member;
        });

        RegisterResponse response = authService.register(request);

        assertEquals(10L, response.id());
        assertEquals("nguyenvana", response.username());
        assertEquals("nguyenvana@example.com", response.email());
        assertEquals("Nguyen Van A", response.fullName());
        assertEquals(Member.UserStatus.ACTIVE, response.status());

        ArgumentCaptor<Member> captor = ArgumentCaptor.forClass(Member.class);
        verify(memberRepository).save(captor.capture());
        Member savedMember = captor.getValue();
        assertEquals("encoded-password", savedMember.getPasswordHash());
        assertEquals("nguyenvana", savedMember.getUsername());
    }

    @Test
    @DisplayName("Should reject register when email exists in admin table")
    void register_emailExistsInAdmin_throwsDuplicateResourceException() {
        RegisterRequest request = new RegisterRequest("admin", "Admin", "admin@example.com", "password123");
        when(adminRepository.existsByEmail(request.email())).thenReturn(true);

        DuplicateResourceException exception = assertThrows(
                DuplicateResourceException.class,
                () -> authService.register(request)
        );

        assertTrue(exception.getMessage().contains("email"));
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("Should rotate refresh token and revoke old token")
    void refresh_validMemberRefreshToken_returnsNewTokensAndRevokesOldToken() {
        Member member = member(1L, "member@example.com", "member", "Member Name");
        RefreshToken storedToken = refreshToken(member, null, "old-refresh-token", false, Instant.now().plusSeconds(60));
        storedToken.setDeviceInfo("JUnit");
        storedToken.setIpAddress("127.0.0.1");

        when(jwtDecoder.decode("old-refresh-token"))
                .thenReturn(refreshJwt("old-refresh-token", "member@example.com", "MEMBER", "refresh"));
        when(refreshTokenRepository.findByTokenHash(sha256("old-refresh-token")))
                .thenReturn(Optional.of(storedToken));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class)))
                .thenReturn(jwt("new-access-token"), jwt("new-refresh-token"));

        LoginResponse response = authService.refresh("old-refresh-token");

        assertEquals("new-access-token", response.accessToken());
        assertEquals("new-refresh-token", response.refreshToken());
        assertTrue(storedToken.getRevoked());

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        RefreshToken newToken = captor.getValue();
        assertEquals(member, newToken.getMember());
        assertEquals(sha256("new-refresh-token"), newToken.getTokenHash());
        assertFalse(newToken.getRevoked());
    }

    @Test
    @DisplayName("Should reject refresh token when stored token is revoked")
    void refresh_revokedStoredToken_throwsInvalidTokenException() {
        Member member = member(1L, "member@example.com", "member", "Member Name");
        RefreshToken storedToken = refreshToken(member, null, "old-refresh-token", true, Instant.now().plusSeconds(60));

        when(jwtDecoder.decode("old-refresh-token"))
                .thenReturn(refreshJwt("old-refresh-token", "member@example.com", "MEMBER", "refresh"));
        when(refreshTokenRepository.findByTokenHash(sha256("old-refresh-token")))
                .thenReturn(Optional.of(storedToken));

        InvalidTokenException exception = assertThrows(
                InvalidTokenException.class,
                () -> authService.refresh("old-refresh-token")
        );

        assertTrue(exception.getMessage().contains("thu hồi"));
        verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Should reject refresh token when JWT type is not refresh")
    void refresh_tokenTypeIsNotRefresh_throwsInvalidTokenException() {
        when(jwtDecoder.decode("access-token"))
                .thenReturn(refreshJwt("access-token", "member@example.com", "MEMBER", "access"));

        InvalidTokenException exception = assertThrows(
                InvalidTokenException.class,
                () -> authService.refresh("access-token")
        );

        assertTrue(exception.getMessage().contains("không phải refresh token"));
        verify(refreshTokenRepository, never()).findByTokenHash(anyString());
    }

    @Test
    @DisplayName("Should revoke refresh token on logout")
    void logout_validRefreshToken_revokesStoredToken() {
        RefreshToken storedToken = refreshToken(
                member(1L, "member@example.com", "member", "Member Name"),
                null,
                "refresh-token",
                false,
                Instant.now().plusSeconds(60)
        );
        when(refreshTokenRepository.findByTokenHash(sha256("refresh-token"))).thenReturn(Optional.of(storedToken));

        authService.logout("refresh-token");

        assertTrue(storedToken.getRevoked());
    }

    @Test
    @DisplayName("Should return admin profile from getMe when account type is ADMIN")
    void getMe_adminAccount_returnsAdminResponse() {
        Admin admin = admin(99L, "admin@example.com", "admin", "Admin Name");
        when(adminRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));

        AuthUserResponse response = authService.getMe("admin@example.com", "ADMIN");

        assertEquals(99L, response.id());
        assertEquals("admin@example.com", response.email());
        assertEquals("ADMIN", response.accountType());
        assertEquals("ROLE_ADMIN", response.role());
    }

    private Member member(Long id, String email, String username, String fullName) {
        Member member = new Member();
        member.setId(id);
        member.setEmail(email);
        member.setUsername(username);
        member.setFullName(fullName);
        member.setPasswordHash("encoded-password");
        member.setStatus(Member.UserStatus.valueOf("ACTIVE"));
        member.setCreatedAt(Instant.now());
        member.setUpdatedAt(Instant.now());
        return member;
    }

    private Admin admin(Long id, String email, String username, String fullName) {
        Admin admin = new Admin();
        admin.setId(id);
        admin.setEmail(email);
        admin.setUsername(username);
        admin.setFullName(fullName);
        admin.setPasswordHash("encoded-password");
        admin.setStatus(Member.UserStatus.valueOf("ACTIVE"));
        admin.setCreatedAt(Instant.now());
        admin.setUpdatedAt(Instant.now());
        return admin;
    }

    private RefreshToken refreshToken(
            Member member,
            Admin admin,
            String rawToken,
            boolean revoked,
            Instant expiresAt) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setMember(member);
        refreshToken.setAdmin(admin);
        refreshToken.setTokenHash(sha256(rawToken));
        refreshToken.setRevoked(revoked);
        refreshToken.setExpiresAt(expiresAt);
        refreshToken.setCreatedAt(Instant.now());
        return refreshToken;
    }

    private Jwt jwt(String tokenValue) {
        return new Jwt(
                tokenValue,
                Instant.now(),
                Instant.now().plusSeconds(60),
                Map.of("alg", "HS512"),
                Map.of("sub", "subject@example.com")
        );
    }

    private Jwt refreshJwt(String tokenValue, String subject, String accountType, String type) {
        return new Jwt(
                tokenValue,
                Instant.now(),
                Instant.now().plusSeconds(60),
                Map.of("alg", "HS512"),
                Map.of(
                        "sub", subject,
                        "accountType", accountType,
                        "type", type
                )
        );
    }

    private String sha256(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }
}
