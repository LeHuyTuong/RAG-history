package com.example.historyrag.feature.auth.dto;

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @Size(max = 50, message = "Username không được quá 50 ký tự")
        String username,

        @NotBlank(message = "Tên không được để trống")
        @Size(min = 2, max = 255, message = "Tên phải từ 2 đến 255 ký tự")
        String name,

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        String email,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 8, max = 100, message = "Mật khẩu phải có ít nhất 8 ký tự")
        String password
) {
}
