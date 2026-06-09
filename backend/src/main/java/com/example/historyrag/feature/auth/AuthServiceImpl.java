package com.example.historyrag.feature.auth;

import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.exception.InvalidTokenException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.admin.Admin;
import com.example.historyrag.feature.admin.AdminRepository;
import com.example.historyrag.feature.auth.dto.AuthUserResponse;
import com.example.historyrag.feature.auth.dto.LoginRequest;
import com.example.historyrag.feature.auth.dto.LoginResponse;
import com.example.historyrag.feature.auth.dto.RegisterRequest;
import com.example.historyrag.feature.auth.dto.RegisterResponse;
import com.example.historyrag.feature.user.Member;
import com.example.historyrag.feature.user.MemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String REFRESH_TOKEN_TYPE = "refresh";

    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;
    private final AdminRepository adminRepository;
    private final MemberRepository memberRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
            JwtEncoder jwtEncoder,
            JwtDecoder jwtDecoder,
            AdminRepository adminRepository,
            MemberRepository memberRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
            @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration) {
        this.authenticationManager = authenticationManager;
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
        this.adminRepository = adminRepository;
        this.memberRepository = memberRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request, String deviceInfo, String ipAddress) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        AuthAccount account = findAccountByEmail(request.email());
        String accessToken = generateAccessToken(account);
        String refreshToken = generateRefreshToken(account);
        saveRefreshToken(refreshToken, account, deviceInfo, ipAddress);

        log.info("Account logged in successfully: type={}, id={}", account.accountType(), account.id());
        return new LoginResponse(accessToken, refreshToken);
    }

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (adminRepository.existsByEmail(request.email()) || memberRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Account", "email", request.email());
        }

        String username = resolveAvailableUsername(request);
        Member member = new Member();
        member.setUsername(username);
        member.setEmail(request.email());
        member.setPasswordHash(passwordEncoder.encode(request.password()));
        member.setFullName(request.name());
        member.setStatus(ACTIVE_STATUS);
        Instant now = Instant.now();
        member.setCreatedAt(now);
        member.setUpdatedAt(now);

        Member saved = memberRepository.save(member);
        log.info("Member registered successfully: id={}", saved.getId());
        return RegisterResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public LoginResponse refresh(String rawRefreshToken) {
        Jwt jwt = decodeRefreshToken(rawRefreshToken);
        String tokenHash = hashToken(rawRefreshToken);

        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidTokenException("Refresh token không hợp lệ"));

        validateStoredRefreshToken(storedToken);
        storedToken.setRevoked(true);

        AuthAccount account = accountFromRefreshToken(storedToken, jwt);
        String newAccessToken = generateAccessToken(account);
        String newRefreshToken = generateRefreshToken(account);
        saveRefreshToken(newRefreshToken, account, storedToken.getDeviceInfo(), storedToken.getIpAddress());

        log.info("Refresh token rotated for account: type={}, id={}", account.accountType(), account.id());
        return new LoginResponse(newAccessToken, newRefreshToken);
    }

    @Override
    @Transactional
    public void logout(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);
        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidTokenException("Refresh token không hợp lệ"));

        storedToken.setRevoked(true);
        log.info("Refresh token revoked");
    }

    @Override
    @Transactional(readOnly = true)
    public AuthUserResponse getMe(String email, String accountType) {
        if (AuthAccount.ADMIN_ACCOUNT_TYPE.equals(accountType)) {
            Admin admin = adminRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Admin", "email", email));
            return AuthUserResponse.fromAdmin(admin);
        }
        if (AuthAccount.MEMBER_ACCOUNT_TYPE.equals(accountType)) {
            Member member = memberRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Member", "email", email));
            return AuthUserResponse.fromMember(member);
        }

        AuthAccount account = findAccountByEmail(email);
        return account.toResponse();
    }

    private AuthAccount findAccountByEmail(String email) {
        return adminRepository.findByEmail(email)
                .map(admin -> AuthAccount.fromAdmin(admin))
                .or(() -> memberRepository.findByEmail(email).map(AuthAccount::fromMember))
                .orElseThrow(() -> new ResourceNotFoundException("Account", "email", email));
    }

    private AuthAccount accountFromRefreshToken(RefreshToken refreshToken, Jwt jwt) {
        String tokenAccountType = jwt.getClaimAsString("accountType");
        if (refreshToken.getAdmin() != null) {
            requireMatchingAccountType(tokenAccountType, AuthAccount.ADMIN_ACCOUNT_TYPE);
            return AuthAccount.fromAdmin(refreshToken.getAdmin());
        }
        if (refreshToken.getMember() != null) {
            requireMatchingAccountType(tokenAccountType, AuthAccount.MEMBER_ACCOUNT_TYPE);
            return AuthAccount.fromMember(refreshToken.getMember());
        }
        throw new InvalidTokenException("Refresh token không có chủ sở hữu");
    }

    private void requireMatchingAccountType(String actual, String expected) {
        if (!expected.equals(actual)) {
            throw new InvalidTokenException("Refresh token không khớp loại tài khoản");
        }
    }

    private void validateStoredRefreshToken(RefreshToken storedToken) {
        if (Boolean.TRUE.equals(storedToken.getRevoked())) {
            throw new InvalidTokenException("Refresh token đã bị thu hồi");
        }
        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidTokenException("Refresh token đã hết hạn");
        }
    }

    private Jwt decodeRefreshToken(String rawRefreshToken) {
        try {
            Jwt jwt = jwtDecoder.decode(rawRefreshToken);
            if (!REFRESH_TOKEN_TYPE.equals(jwt.getClaimAsString("type"))) {
                throw new InvalidTokenException("Token không phải refresh token");
            }
            return jwt;
        } catch (JwtException ex) {
            throw new InvalidTokenException("Refresh token không hợp lệ");
        }
    }

    private String generateAccessToken(AuthAccount account) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(account.email())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(accessTokenExpiration))
                .claim("userId", account.id())
                .claim("accountType", account.accountType())
                .claim("roles", List.of(account.role()))
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS512).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private String generateRefreshToken(AuthAccount account) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .id(UUID.randomUUID().toString())
                .subject(account.email())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(refreshTokenExpiration))
                .claim("userId", account.id())
                .claim("accountType", account.accountType())
                .claim("type", REFRESH_TOKEN_TYPE)
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS512).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private void saveRefreshToken(String rawToken, AuthAccount account, String deviceInfo, String ipAddress) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenHash(hashToken(rawToken));
        refreshToken.setExpiresAt(Instant.now().plusSeconds(refreshTokenExpiration));
        refreshToken.setDeviceInfo(deviceInfo);
        refreshToken.setIpAddress(ipAddress);
        refreshToken.setRevoked(false);
        refreshToken.setCreatedAt(Instant.now());

        if (AuthAccount.ADMIN_ACCOUNT_TYPE.equals(account.accountType())) {
            refreshToken.setAdmin(account.admin());
        } else {
            refreshToken.setMember(account.member());
        }

        refreshTokenRepository.save(refreshToken);
    }

    private String resolveAvailableUsername(RegisterRequest request) {
        String requestedUsername = request.username();
        String baseUsername = requestedUsername == null || requestedUsername.isBlank()
                ? request.email().substring(0, request.email().indexOf('@'))
                : requestedUsername;
        baseUsername = normalizeUsername(baseUsername);

        if (baseUsername.isBlank()) {
            throw new InvalidRequestException("Username không hợp lệ");
        }

        String candidate = baseUsername;
        int suffix = 1;
        while (adminRepository.existsByUsername(candidate) || memberRepository.existsByUsername(candidate)) {
            String suffixText = String.valueOf(suffix);
            int maxBaseLength = 50 - suffixText.length();
            candidate = baseUsername.substring(0, Math.min(baseUsername.length(), maxBaseLength)) + suffixText;
            suffix++;
        }
        return candidate;
    }

    private String normalizeUsername(String username) {
        String normalized = username.trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9._-]", "");
        if (normalized.length() > 50) {
            return normalized.substring(0, 50);
        }
        return normalized;
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
