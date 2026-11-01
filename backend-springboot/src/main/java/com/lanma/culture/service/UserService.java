package com.lanma.culture.service;

import com.lanma.culture.dto.AuthResponse;
import com.lanma.culture.dto.LoginRequest;
import com.lanma.culture.dto.RegisterRequest;
import com.lanma.culture.dto.WxLoginRequest;
import com.lanma.culture.entity.User;
import com.lanma.culture.repository.UserRepository;
import com.lanma.culture.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RoleDefinitionService roleDefinitionService;

    /** 可选配置 - 配置后才会真正调微信 jscode2session */
    @Value("${app.weixin.appid:}")
    private String weixinAppid;

    @Value("${app.weixin.secret:}")
    private String weixinSecret;

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

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

    /**
     * 微信一键登录
     * <p>
     * 1) 调用微信 jscode2session(若配置了 appid/secret)换取 openid + session_key<br>
     * 2) 否则用 {@code sha256(code + "|" + nickname).substring(0,32)} 作为稳定伪 openid<br>
     * 3) 查表:有该 openid → 直接返回 token;无 → 创建匿名账号(用户名/邮箱自动生成)<br>
     * 4) 若有 nickname / avatarUrl,则更新用户资料
     */
    public AuthResponse wxLogin(WxLoginRequest request) {
        String code = request.getCode();
        String nickname = request.getNickname();
        String avatarUrl = request.getAvatarUrl();

        String openid = resolveOpenid(code, nickname);
        if (openid == null || openid.isEmpty()) {
            throw new IllegalArgumentException("微信登录失败:无法获取 openid");
        }

        User user = userRepository.findByWxOpenid(openid).orElse(null);
        if (user == null) {
            user = createWechatUser(openid, nickname, avatarUrl);
        } else {
            // 已存在账号:同步更新昵称/头像(用户可能修改)
            boolean dirty = false;
            if (avatarUrl != null && !avatarUrl.isEmpty()
                    && (user.getAvatarUrl() == null || !user.getAvatarUrl().equals(avatarUrl))) {
                user.setAvatarUrl(avatarUrl);
                dirty = true;
            }
            if (nickname != null && !nickname.isEmpty()
                    && (user.getUsername() == null || user.getUsername().startsWith("wx_"))) {
                // 仅当 username 仍是自动生成的 wx_ 前缀时才覆盖,保护用户自定义用户名
                user.setUsername(generateUniqueUsername(nickname));
                dirty = true;
            }
            if (dirty) user = userRepository.save(user);
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getRole());
        log.info("wx-login success: openid={} -> userId={}", openid, user.getId());
        return buildAuthResponse(token, user);
    }

    /**
     * 解析 openid:优先调微信 jscode2session;否则用本地稳定哈希
     */
    private String resolveOpenid(String code, String nickname) {
        if (weixinAppid != null && !weixinAppid.isEmpty()
                && weixinSecret != null && !weixinSecret.isEmpty()) {
            try {
                String url = String.format(Locale.ROOT,
                        "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                        weixinAppid, weixinSecret, code);
                HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                        .timeout(Duration.ofSeconds(5))
                        .GET()
                        .build();
                HttpResponse<String> resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                JsonNode json = MAPPER.readTree(resp.body());
                String openid = json.path("openid").asText("");
                String errcode = json.path("errcode").asText("0");
                if (!openid.isEmpty() && "0".equals(errcode)) {
                    return openid;
                }
                log.warn("weixin jscode2session failed: errcode={} errmsg={}", errcode, json.path("errmsg").asText(""));
            } catch (Exception e) {
                log.warn("weixin jscode2session exception, fallback to local hash: {}", e.getMessage());
            }
        }
        // 降级:本地稳定哈希(开发/演示环境)
        return sha256Hex(code + "|" + (nickname == null ? "" : nickname)).substring(0, 32);
    }

    /** 创建微信账号:username/email 自动生成,role=runner */
    private User createWechatUser(String openid, String nickname, String avatarUrl) {
        String baseNick = (nickname == null || nickname.trim().isEmpty()) ? "微信用户" : nickname.trim();
        User user = new User();
        user.setWxOpenid(openid);
        user.setUsername(generateUniqueUsername(baseNick));
        user.setEmail(openid + "@wx.lanma"); // 唯一占位邮箱(不展示)
        user.setPasswordHash(passwordEncoder.encode("wx@" + openid.substring(0, 6)));
        user.setRole("runner");
        if (avatarUrl != null && !avatarUrl.isEmpty()) {
            user.setAvatarUrl(avatarUrl);
        }
        return userRepository.save(user);
    }

    /** 生成不冲突的 username:昵称 + openid 短串,若冲突则在尾段递增 */
    private String generateUniqueUsername(String nickname) {
        String safe = nickname.replaceAll("[^\\u4e00-\\u9fa5a-zA-Z0-9_]", "");
        if (safe.isEmpty()) safe = "微信用户";
        if (safe.length() > 12) safe = safe.substring(0, 12);
        String candidate = "wx_" + safe;
        if (!userRepository.existsByUsername(candidate)) {
            return candidate;
        }
        for (int i = 1; i < 1000; i++) {
            String alt = candidate + "_" + i;
            if (!userRepository.existsByUsername(alt)) {
                return alt;
            }
        }
        // 极端情况兜底
        return "wx_user_" + System.currentTimeMillis();
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return Integer.toHexString(input.hashCode());
        }
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
