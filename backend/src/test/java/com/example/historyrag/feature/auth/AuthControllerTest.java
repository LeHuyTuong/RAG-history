package com.example.historyrag.feature.auth;

import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.GlobalExceptionHandler;
import com.example.historyrag.feature.auth.dto.AuthUserResponse;
import com.example.historyrag.feature.auth.dto.LoginRequest;
import com.example.historyrag.feature.auth.dto.LoginResponse;
import com.example.historyrag.feature.auth.dto.RegisterRequest;
import com.example.historyrag.feature.auth.dto.RegisterResponse;
import com.example.historyrag.feature.user.Member;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        AuthController controller = new AuthController(authService, 259200);
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new JwtArgumentResolver())
                .setValidator(validator)
                .build();
    }

    @Test
    @DisplayName("Should return tokens and refresh cookie when login is valid")
    void login_validRequest_returnsTokensAndCookie() throws Exception {
        when(authService.login(any(LoginRequest.class), eq("JUnit"), eq("127.0.0.1")))
                .thenReturn(new LoginResponse("access-token", "refresh-token"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("User-Agent", "JUnit")
                        .with(request -> {
                            request.setRemoteAddr("127.0.0.1");
                            return request;
                        })
                        .content("""
                                {"email":"member@example.com","password":"password123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Đăng nhập thành công"))
                .andExpect(jsonPath("$.data.accessToken").value("access-token"))
                .andExpect(jsonPath("$.data.refreshToken").value("refresh-token"))
                .andExpect(header().string("Set-Cookie", containsString("refresh_token=refresh-token")))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=259200")));
    }

    @Test
    @DisplayName("Should return validation error when login email is invalid")
    void login_invalidEmail_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"invalid-email","password":"password123"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.details[0]", containsString("email")));

        verifyNoInteractions(authService);
    }

    @Test
    @DisplayName("Should return created response when register is valid")
    void register_validRequest_returnsCreated() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
                .thenReturn(new RegisterResponse(
                        1L,
                        "member",
                        "member@example.com",
                        "Member Name",
                        Member.UserStatus.ACTIVE,
                        Instant.parse("2026-06-09T00:00:00Z")
                ));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username":"member",
                                  "name":"Member Name",
                                  "email":"member@example.com",
                                  "password":"password123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statusCode").value(201))
                .andExpect(jsonPath("$.message").value("Đăng ký thành công"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.username").value("member"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("Should return conflict when register email already exists")
    void register_duplicateEmail_returnsConflict() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new DuplicateResourceException("Account", "email", "member@example.com"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Member Name",
                                  "email":"member@example.com",
                                  "password":"password123"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.statusCode").value(409))
                .andExpect(jsonPath("$.message", containsString("email")));
    }

    @Test
    @DisplayName("Should refresh using cookie token before body token")
    void refresh_cookieAndBodyProvided_usesCookieToken() throws Exception {
        when(authService.refresh("cookie-refresh-token"))
                .thenReturn(new LoginResponse("new-access-token", "new-refresh-token"));

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .cookie(new Cookie("refresh_token", "cookie-refresh-token"))
                        .content("""
                                {"refreshToken":"body-refresh-token"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.accessToken").value("new-access-token"))
                .andExpect(jsonPath("$.data.refreshToken").value("new-refresh-token"))
                .andExpect(header().string("Set-Cookie", containsString("refresh_token=new-refresh-token")));

        verify(authService).refresh("cookie-refresh-token");
        verify(authService, never()).refresh("body-refresh-token");
    }

    @Test
    @DisplayName("Should return unauthorized when refresh token is missing")
    void refresh_missingToken_returnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.statusCode").value(401));

        verify(authService, never()).refresh(anyString());
    }

    @Test
    @DisplayName("Should revoke cookie refresh token and clear cookie on logout")
    void logout_cookieToken_revokesTokenAndClearsCookie() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(new Cookie("refresh_token", "refresh-token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(header().string("Set-Cookie", containsString("refresh_token=")))
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));

        verify(authService).logout("refresh-token");
    }

    @Test
    @DisplayName("Should return current user profile from JWT principal")
    void getMe_validJwt_returnsCurrentUser() throws Exception {
        when(authService.getMe("member@example.com", "MEMBER"))
                .thenReturn(new AuthUserResponse(
                        1L,
                        "member",
                        "member@example.com",
                        "Member Name",
                        Member.UserStatus.ACTIVE,
                        "MEMBER",
                        "ROLE_USER",
                        Instant.parse("2026-06-09T00:00:00Z")
                ));

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.email").value("member@example.com"))
                .andExpect(jsonPath("$.data.accountType").value("MEMBER"))
                .andExpect(jsonPath("$.data.role").value("ROLE_USER"));
    }

    private static class JwtArgumentResolver implements HandlerMethodArgumentResolver {

        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                    && Jwt.class.isAssignableFrom(parameter.getParameterType());
        }

        @Override
        public Object resolveArgument(
                MethodParameter parameter,
                ModelAndViewContainer mavContainer,
                NativeWebRequest webRequest,
                WebDataBinderFactory binderFactory) {
            return new Jwt(
                    "access-token",
                    Instant.now(),
                    Instant.now().plusSeconds(60),
                    Map.of("alg", "HS512"),
                    Map.of(
                            "sub", "member@example.com",
                            "accountType", "MEMBER"
                    )
            );
        }
    }
}
