package com.lanma.culture.controller;

import com.lanma.culture.dto.*;
import com.lanma.culture.entity.User;
import com.lanma.culture.security.JwtTokenProvider;
import com.lanma.culture.service.UserService;
import lombok.extern.slf4j.Slf4j;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 微信一键登录:小程序端 wx.login 拿 code + 头像昵称,后端换 openid 或本地稳定哈希,
     * 命中则直接返回 token,未命中则创建匿名账号并返回。
     */
    @PostMapping("/wx-login")
    public ResponseEntity<ApiResponse<AuthResponse>> wxLogin(@Valid @RequestBody WxLoginRequest request) {
        try {
            AuthResponse authResponse = userService.wxLogin(request);
            return ResponseEntity.ok(ApiResponse.success("微信登录成功", authResponse));
        } catch (IllegalArgumentException e) {
            log.warn("wx-login rejected: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(e.getMessage()));
        } catch (Exception e) {
            log.error("wx-login error", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error(500, "微信登录失败:" + e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse authResponse = userService.register(request);
        return ResponseEntity.status(201).body(ApiResponse.created(authResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = userService.login(request);
        return ResponseEntity.ok(ApiResponse.success("登录成功", authResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        jwtTokenProvider.invalidateToken(userId);
        return ResponseEntity.ok(ApiResponse.success("已退出登录", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        User user = userService.getUserById(userId);
        user.setPasswordHash(null);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<User>> updateProfile(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        String username = (String) body.get("username");
        String avatarUrl = (String) body.get("avatar_url");
        String occupation = (String) body.get("occupation");
        Integer age = body.get("age") != null ? Integer.valueOf(body.get("age").toString()) : null;
        String gender = (String) body.get("gender");
        User user = userService.updateProfile(userId, username, avatarUrl, occupation, age, gender);
        user.setPasswordHash(null);
        return ResponseEntity.ok(ApiResponse.success("更新成功", user));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> updatePassword(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        String oldPassword = body.get("old_password");
        String newPassword = body.get("new_password");
        if (oldPassword == null || oldPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("请输入原密码"));
        }
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("请输入新密码"));
        }
        userService.updatePassword(userId, oldPassword, newPassword);
        return ResponseEntity.ok(ApiResponse.success("密码修改成功", null));
    }
}
