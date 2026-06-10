package com.example.historyrag.feature.user;

import com.example.historyrag.feature.user.dto.UpdateUserRequest;
import com.example.historyrag.feature.user.dto.UserResponse;

import java.util.List;

public interface MemberService {

    UserResponse getUserById(Long id);

    UserResponse getUserByEmail(String email);

    UserResponse updateUser(Long id, UpdateUserRequest request);

    void deleteUser(Long id);

    List<UserResponse> getAllUsers();

    UserResponse getCurrentUser();
}