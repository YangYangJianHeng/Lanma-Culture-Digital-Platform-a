package com.lanma.culture.service;

import com.lanma.culture.dto.AuthResponse;
import com.lanma.culture.dto.LoginRequest;
import com.lanma.culture.dto.RegisterRequest;
import com.lanma.culture.entity.User;
import com.lanma.culture.repository.UserRepository;
import com.lanma.culture.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RoleDefinitionService roleDefinitionService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("邮箱已被注册");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("用户名已被注册");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole("runner");
        user.setOccupation(request.getOccupation());
        user.setAge(request.getAge());
        user.setGender(request.getGender());
        user = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getId(), user.getRole());
        return buildAuthResponse(token, user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("用户名或密码错误"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("用户名或密码错误");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getRole());
        return buildAuthResponse(token, user);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
    }

    public Page<User> getAllUsers(int page, int limit) {
        return userRepository.findAll(PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    public User updateUser(Long id, String username, String email, String role) {
        User user = getUserById(id);
        if (username != null) user.setUsername(username);
        if (email != null) user.setEmail(email);
        if (role != null) user.setRole(role);
        return userRepository.save(user);
    }

    public User updateUserAdmin(Long id, String username, String email, String role,
                                 String occupation, Integer age, String gender) {
        User user = getUserById(id);
        if (username != null) user.setUsername(username);
        if (email != null) user.setEmail(email);
        if (role != null) {
            if (!roleDefinitionService.existsByRoleName(role)) {
                throw new IllegalArgumentException("无效的角色类型: " + role);
            }
            user.setRole(role);
        }
        if (occupation != null) user.setOccupation(occupation);
        if (age != null) user.setAge(age);
        if (gender != null) user.setGender(gender);
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public User updateProfile(Long userId, String username, String avatarUrl,
                               String occupation, Integer age, String gender) {
        User user = getUserById(userId);
        if (username != null && !username.trim().isEmpty()) {
            if (!user.getUsername().equals(username) && userRepository.existsByUsername(username)) {
                throw new IllegalArgumentException("用户名已被注册");
            }
            user.setUsername(username.trim());
        }
        if (avatarUrl != null) {
            user.setAvatarUrl(avatarUrl.isEmpty() ? null : avatarUrl);
        }
        if (occupation != null) user.setOccupation(occupation);
        if (age != null) user.setAge(age);
        if (gender != null) user.setGender(gender);
        return userRepository.save(user);
    }

    public void updatePassword(Long userId, String oldPassword, String newPassword) {
        User user = getUserById(userId);
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("原密码错误");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("新密码长度不能少于6位");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        jwtTokenProvider.invalidateToken(userId);
    }

    private AuthResponse buildAuthResponse(String token, User user) {
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getAvatarUrl(),
                user.getRole(),
                user.getOccupation(),
                user.getAge(),
                user.getGender()
        );
        return new AuthResponse(token, userInfo);
    }
}
