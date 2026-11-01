package com.lanma.culture.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 跑团 / 约跑活动 邀请码。
 * 8 位随机字母数字混合,使用次数 + 过期时间可控。
 */
@Data
@Entity
@Table(name = "team_invite_codes", indexes = {
        @Index(name = "idx_invite_code", columnList = "code", unique = true),
        @Index(name = "idx_invite_team", columnList = "team_id,is_active")
})
public class TeamInviteCode {

    /** 适用对象类型 */
    public static final String SCOPE_RULES_TEAM = "team";       // 跑团
    public static final String SCOPE_RULES_ACTIVITY = "activity"; // 约跑活动

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 12, unique = true)
    private String code;

    /** 适用对象:team / activity */
    @Column(name = "scope_type", nullable = false, length = 20)
    private String scopeType = SCOPE_RULES_TEAM;

    @Column(name = "scope_id", nullable = false)
    private Long scopeId;

    /** 名称(冗余) */
    @Column(name = "scope_name", length = 100)
    private String scopeName;

    @Column(name = "creator_id", nullable = false)
    private Long creatorId;

    @Column(name = "creator_name", length = 50)
    private String creatorName;

    @Column(name = "max_uses", nullable = false)
    private Integer maxUses = 50;

    @Column(name = "current_uses", nullable = false)
    private Integer currentUses = 0;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    /** 是否已过期 */
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
}