package com.lanma.culture.service;

import com.lanma.culture.entity.Team;
import com.lanma.culture.entity.TeamInviteCode;
import com.lanma.culture.entity.User;
import com.lanma.culture.repository.TeamInviteCodeRepository;
import com.lanma.culture.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 跑团 / 活动 邀请码服务。
 * 8 位字母数字随机,使用次数 + 过期时间可控。
 */
@Service
@RequiredArgsConstructor
public class InviteCodeService {

    private static final char[] ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789".toCharArray(); // 去易混字符
    private static final SecureRandom RNG = new SecureRandom();
    private static final int CODE_LENGTH = 8;

    private final TeamInviteCodeRepository inviteCodeRepository;
    private final UserRepository userRepository;

    public TeamInviteCode create(Long creatorId, String scopeType, Long scopeId,
                                 String scopeName, Integer maxUses, Integer validDays) {
        if (!TeamInviteCode.SCOPE_RULES_TEAM.equals(scopeType)
                && !TeamInviteCode.SCOPE_RULES_ACTIVITY.equals(scopeType)) {
            throw new IllegalArgumentException("scopeType 必须为 team 或 activity");
        }
        if (scopeId == null) throw new IllegalArgumentException("scopeId 不能为空");
        User u = userRepository.findById(creatorId).orElseThrow(() -> new IllegalArgumentException("用户不存在"));

        TeamInviteCode c = new TeamInviteCode();
        c.setCode(generateUniqueCode());
        c.setScopeType(scopeType);
        c.setScopeId(scopeId);
        c.setScopeName(scopeName);
        c.setCreatorId(creatorId);
        c.setCreatorName(u.getUsername());
        c.setMaxUses(maxUses != null && maxUses > 0 ? maxUses : 50);
        c.setCurrentUses(0);
        c.setExpiresAt(LocalDateTime.now().plusDays(validDays != null && validDays > 0 ? validDays : 7));
        c.setIsActive(true);
        return inviteCodeRepository.save(c);
    }

    public List<TeamInviteCode> listByScope(String scopeType, Long scopeId) {
        return inviteCodeRepository.findByScopeTypeAndScopeIdAndIsActiveTrueOrderByCreatedAtDesc(scopeType, scopeId);
    }

    public List<TeamInviteCode> listByCreator(Long creatorId) {
        return inviteCodeRepository.findByCreatorIdOrderByCreatedAtDesc(creatorId);
    }

    /**
     * 兑换邀请码:
     * <ul>
     *   <li>校验是否过期 / 禁用 / 超过 maxUses</li>
     *   <li>返回 scope 信息,等待业务侧调用 join</li>
     * </ul>
     */
    public Map<String, Object> resolve(String code, Long userId) {
        if (code == null || code.trim().isEmpty()) {
            throw new IllegalArgumentException("邀请码不能为空");
        }
        TeamInviteCode c = inviteCodeRepository.findByCode(code.trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("邀请码无效"));
        if (!Boolean.TRUE.equals(c.getIsActive())) {
            throw new IllegalArgumentException("邀请码已停用");
        }
        if (c.isExpired()) {
            throw new IllegalArgumentException("邀请码已过期");
        }
        if (c.getCurrentUses() >= c.getMaxUses()) {
            throw new IllegalArgumentException("邀请码已被使用完");
        }
        // 兑换成功 — 增加次数
        c.setCurrentUses(c.getCurrentUses() + 1);
        inviteCodeRepository.save(c);

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("code", c.getCode());
        r.put("scope_type", c.getScopeType());
        r.put("scope_id", c.getScopeId());
        r.put("scope_name", c.getScopeName());
        r.put("used", c.getCurrentUses());
        r.put("max", c.getMaxUses());
        r.put("expires_at", c.getExpiresAt());
        return r;
    }

    public void deactivate(Long id) {
        TeamInviteCode c = inviteCodeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("邀请码不存在"));
        c.setIsActive(false);
        inviteCodeRepository.save(c);
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(ALPHA[RNG.nextInt(ALPHA.length)]);
            }
            String code = sb.toString();
            if (!inviteCodeRepository.existsByCode(code)) return code;
        }
        // 极端情况,加时间戳兜底
        return Long.toHexString(System.currentTimeMillis()).toUpperCase();
    }
}